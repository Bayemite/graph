import * as util from './util.js';
import * as cards from './cards.js';

function initListeners(canvas, cardsData) {
    util.addSaveOpenFileListeners(cardsData);
    util.addLocalSaveListener(cardsData);

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey) {
            if (event.key == 'z') {
                cardsData.undo();
                event.preventDefault();
            }
            else if (event.key == 'y') {
                cardsData.undoRedoStack.redo();
                event.preventDefault();
            }
        }
        else if (event.altKey) {
            if (event.key == 'n') {
                const camera = window.camera;
                cardsData.addDefaultCardHtml(camera.globalCoords(camera.mousePos), true);
            }
        }
        else {
            if (event.key == "Delete") {
                let id = cardsData.focusCardID;
                let cardTag = util.getCardTag(id);
                if (document.hasFocus(cardTag.querySelector('.text')))
                    return;
                cardsData.focusCard(-1);
                if (id != -1)
                    cardsData.deleteCard(id);
            }
        }
    });
    document.addEventListener('mousedown', () => cardsData.focusCard(-1));
    document.addEventListener('touchstart', () => cardsData.focusCard(-1));
    function mouseUp() {
        cardsData.moveCardID = -1;
        window.camera.onMouseUp();
    }
    document.addEventListener('mouseup', mouseUp);
    document.addEventListener('touchend', mouseUp);

    function mouseMove(event) {
        // Mouse events are up in card creation
        if (cardsData.moveCardID != -1)
            cardsData.moveElem();

        if (event.touches != undefined)
            window.camera.onMouseMove(util.vec2(event.touches[0].pageX, event.touches[0].pageY));
        else window.camera.onMouseMove(util.vec2(event.pageX, event.pageY));

        // cardsData.addDefaultCardHtml(camera.globalCoords(camera.mousePos), true);
    }
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('touchmove', mouseMove);

    canvas.addEventListener('dblclick', () => {
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
                // The undo is packaged with the new card creation.
                let addUndo = false;
                cardsData.endLink(id, addUndo);
            }
            else cardsData.linkInProgress = false;
        }
    }
    canvas.addEventListener('touchstart', mouseDown);
    canvas.addEventListener('mousedown', mouseDown);

    document.addEventListener('wheel', (event) => {
        event.preventDefault();
        window.camera.onWheel(event);
    }, { passive: false }
    );

    document.getElementById('reset-button').onclick = () => {
        cardsData.cardsData = new Map();
        cardsData.addCardsHTML();
    };

    document.getElementById('theme-button').onclick = () => {
        let theme = util.getTheme();
        theme = theme == 'dark' ? 'light' : 'dark';
        util.setTheme(theme);
        util.updateTheme();
        // Re-render all cards with new color theme
        cardsData.addCardsHTML();
    };
}

window.onload = function () {
    Coloris({ clearButton: false });

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    globalThis.ctx = ctx;
    ctx.imageSmoothingEnabled = true;

    window.camera = new util.Camera();
    let cardsData = new cards.CardsData();

    initListeners(canvas, cardsData);
    util.loadLocalSave(cardsData);

    util.updateTheme();
    // Re-render all cards with new color theme
    cardsData.addCardsHTML();

    function main() {
        window.requestAnimationFrame(main);
        window.camera.update();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let theme = util.getTheme();
        if (theme == 'dark') {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'white';
        }
        else {
            ctx.fillStyle = 'black';
            ctx.strokeStyle = 'black';
        }

        ctx.lineWidth = 2 * window.camera.zoom;

        if (cardsData.linkInProgress) {
            let linkOriginElem = document.getElementById(`card-${cardsData.linkStart}`);
            util.drawLinkLine(ctx, linkOriginElem);
        }

        util.drawLinks(ctx, cardsData);
    }

    main(); // Start the cycle
};