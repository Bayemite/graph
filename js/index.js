import * as util from './util.js';
import * as card from './cards.js';

let visited = localStorage.getItem('visited');
if (visited == null) {
    localStorage.setItem('visited', 'true');

    const initDialog = new util.Dialog(
        'Under Development',
        util.tag(
            'p',
            `This mindmapping website is under development!<br>
            Some features may not be available or may not function properly.<br>
            You can follow along at <a style="overflow-wrap: anywhere;"
            href="https://github.com/bayemite/graph">https://github.com/bayemite/graph</a>.`
        ),
        'OK'
    );
    initDialog.show();
}

window.onload = async () => {
    Coloris({ clearButton: false });
    await util.loadSettings();

    let canvasTag = document.getElementById('canvas');
    let dashboardTag = document.querySelector('#file-sidebar-content');

    let cardsData = new card.CardsData();
    window.camera = new util.Camera(cardsData);

    let localSaver = await util.localSaver(cardsData, dashboardTag);
    let peerManager = new util.PeerManager(cardsData, localSaver);

    peerManager.initListeners();
    initListeners(canvasTag, cardsData, localSaver);
    mobileSidebarListeners();

    await localSaver.loadLocalSave();

    cardsData.updateHTML(false);
    util.updateTheme(cardsData);

    window.camera.update();
};

function mobileSidebarListeners() {
    let open = false;
    document.querySelector('#left-sidebar-mobile-open').onclick = () => {
        open = !open;
        let visible = open ? 'visible' : 'hidden';
        let sidebars = document.getElementsByClassName('sidebar');

        for (let s of sidebars)
            s.style.visibility = visible;
    };
}

function initListeners(canvas, cardsData, localSaver) {
    localSaver.addLocalSaveListeners();
    localSaver.loadDashboardListener();

    document.getElementById('menu').onclick = () => util.sidebar.toggle('file-sidebar');
    util.addImageListeners(cardsData);
    document.getElementById('peer-button').onclick = () => util.sidebar.toggle('peer-sidebar');

    let themeBtn = document.getElementById('theme-button');
    themeBtn.onclick = () => {
        let theme = util.getTheme();
        themeBtn.querySelector("span").innerHTML = `
            ${theme}_mode
        `;
        theme = theme == 'dark' ? 'light' : 'dark';
        util.setTheme(theme);
        util.updateTheme(cardsData);
    };

    document.getElementById('settings-button').onclick = async () => {
        let tag = await util.settingsTag();

        let settingsDialog = new util.Dialog(
            'Settings',
            tag,
            [
                { label: 'Cancel' },
                { label: 'Ok', onclick: () => util.loadSettings(tag) }
            ]
        );
        settingsDialog.show();
    };

    util.addExternSaveFileListeners(cardsData, localSaver);

    document.getElementById('new-button').onclick = async () => {
        let id = await localSaver.createNewSave();
        window.location.href = `index.html?id=${id}`;
    };

    document.getElementById('undo-button').onclick = () => cardsData.undo();
    document.getElementById('redo-button').onclick = () => cardsData.redo();
    document.getElementById('title').onchange = (e) => {
        cardsData.title = e.target.value;
        cardsData.undoRedoStack.dispatchChange({ type: 'title-change' });
    };

    function resize() {
        util.setCanvasSize(canvas);
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'Escape': {
                cardsData.endLink(null, false);
                break;
            }
            case 'Delete': {
                let id = cardsData.focusCardID;
                if (id == -1)
                    break;
                let cardTag = card.getCardTag(id);
                if (document.activeElement == cardTag.querySelector('.text'))
                    break;
                cardsData.focusCard(-1);
                if (id != -1)
                    cardsData.deleteCard(id);
                break;
            }
            case 'n': {
                if (event.altKey) {
                    const camera = window.camera;
                    cardsData.addDefaultCardHtml(camera.globalCoords(camera.mousePos), true);
                }
                break;
            }
            case 'y': {
                if (event.ctrlKey) {
                    cardsData.redo();
                    event.preventDefault();
                }
                break;
            }
            case 'z': {
                if (event.ctrlKey) {
                    cardsData.undo();
                    event.preventDefault();
                }
                break;
            }
        }
    });

    const magicClipboardNum = 'card-clipboard-object-magic-num';
    document.addEventListener('copy', (event) => {
        let id = cardsData.focusCardID;

        if (id != -1 && document.activeElement === document.body) {
            let obj = cardsData.get(id).serialise();
            obj.magicClipboardNum = magicClipboardNum;
            event.clipboardData.setData('application/json', JSON.stringify(obj));
            event.preventDefault();
        }
    });

    document.addEventListener('paste', (event) => {
        if (document.activeElement !== document.body) return;

        let data = event.clipboardData.getData('application/json');
        let obj = JSON.parse(data);
        if (!obj || obj.magicClipboardNum !== magicClipboardNum) {
            return;
        }
        obj.magicClipboardNum = undefined;

        let id = cardsData.cardIds.getNextId();
        obj.pos = window.camera.globalCoords(window.camera.mousePos);
        cardsData.restoreCard(id, card.CardObject.deserialise(obj), [], true, true);
    });

    let linksSvg = util.getLinksContainer();
    window.touchHandler = new util.TouchHandler();
    let touchHandler = window.touchHandler;

    linksSvg.addEventListener('pointerdown', e => {
        touchHandler.onpointerdown(e);
        cardsData.focusCard(-1);
        util.sidebar.closeAll();

        const camera = window.camera;
        camera.onPointerDown(util.vec2(e.pageX, e.pageY));

        if (cardsData.linkInProgress) {
            if (e.button == 0) {
                let pos = camera.globalCoords(camera.mousePos);
                let centerOrigin = true;
                let id = cardsData.addDefaultCardHtml(pos, centerOrigin);
                cardsData.endLink(id);
            }
            else cardsData.linkInProgress = false;
        }
    });

    let dblClick = false, dblClickTimer = null;
    linksSvg.addEventListener('click', (e) => {
        const dblClickMargin = 100;
        let round = (a) => Math.ceil(a / dblClickMargin) * dblClickMargin;
        let pos = util.vec2(round(e.pageX), round(e.pageY));

        clearTimeout(dblClickTimer);
        dblClickTimer = setTimeout(() => dblClick = false, 500);
        if (dblClick && dblClick.equals(pos)) {
            const camera = window.camera;
            cardsData.addDefaultCardHtml(camera.globalCoords(camera.mousePos), true);
            dblClick = false;
        }
        else
            dblClick = pos;
    });

    document.addEventListener('pointerup', e => {
        touchHandler.onpointerup(e);
        window.camera.onPointerUp();
    });

    document.addEventListener('pointercancel', e => touchHandler.onpointerup(e));
    document.addEventListener('pointerout', e => touchHandler.onpointerup(e));
    document.addEventListener('pointerleave', e => touchHandler.onpointerup(e));

    document.addEventListener('pointermove', e => {
        touchHandler.onpointermove(e);
        cardsData.moveElem(e);
        if (!touchHandler.isPinchZoom())
            window.camera.onPointerMove(util.vec2(e.pageX, e.pageY));
    });

    document.querySelector('#content').addEventListener('wheel',
        (event) => {
            event.preventDefault();
            window.camera.onWheel(event);
        }, { passive: false }
    );

    linksSvg.addEventListener('wheel',
        (event) => {
            event.preventDefault();
            window.camera.onWheel(event);
        }, { passive: false }
    );

    touchHandler.addEventListener('zoom', e => window.camera.doZoom(e.detail.delta * 4));
};
