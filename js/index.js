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
    document.getElementById('title').onchange = (e) => cardsData.title = e.target.value;

    function resize() {
        util.setCanvasSize(canvas);
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'Delete': {
                let id = cardsData.focusCardID;
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
    let linksSvg = util.getLinksContainer();
    linksSvg.addEventListener('mousedown', () => cardsData.focusCard(-1));
    linksSvg.addEventListener('touchstart', () => cardsData.focusCard(-1));
    function mouseUp() {
        cardsData.moveCardID = -1;
        window.camera.onMouseUp();
    }
    document.addEventListener('mouseup', mouseUp);
    document.addEventListener('touchend', mouseUp);

    function mouseMove(event) {
        if (cardsData.moveCardID != -1)
            cardsData.moveElem();

        if (event.touches != undefined)
            window.camera.onMouseMove(util.vec2(event.touches[0].pageX, event.touches[0].pageY));
        else window.camera.onMouseMove(util.vec2(event.pageX, event.pageY));
    }
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('touchmove', mouseMove);

    linksSvg.addEventListener('dblclick', () => {
        const camera = window.camera;
        cardsData.addDefaultCardHtml(camera.globalCoords(camera.mousePos), true);
    });

    function mouseDown(event) {
        const camera = window.camera;
        if (event.touches != undefined) {
            let t = event.touches[0];
            camera.onMouseDown(util.vec2(t.pageX, t.pageY));
        }
        else camera.onMouseDown(util.vec2(event.pageX, event.pageY));

        if (cardsData.linkInProgress) {
            if (event.touches != undefined || event.button == 0) {
                let pos = camera.globalCoords(camera.mousePos);
                let centerOrigin = true;
                let id = cardsData.addDefaultCardHtml(pos, centerOrigin);
                cardsData.endLink(id);
            }
            else cardsData.linkInProgress = false;
        }
    }
    linksSvg.addEventListener('touchstart', mouseDown);
    linksSvg.addEventListener('mousedown', mouseDown);

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
};