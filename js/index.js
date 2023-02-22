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

    document.onkeydown = (event) => {
        if (event.ctrlKey) {
            if (event.code == "KeyZ")
                cardsData.undo();
            else if (event.code == "KeyY")
                cardsData.undoRedoStack.redo();
        }
    };
    document.addEventListener('mouseup', () => {
        cardsData.moveFlag = false;
        window.camera.onMouseUp();
    });
    document.addEventListener('mousemove', (event) => {
        // Mouse events are up in card creation
        if (cardsData.moveFlag)
            cardsData.moveElem();

        window.camera.onMouseMove(event);

        // cardsData.addDefaultCardHtml(camera.globalCoords(camera.mousePos), true);
    });

    canvas.addEventListener('dblclick', () => {
        const camera = window.camera;
        cardsData.addDefaultCardHtml(camera.globalCoords(camera.mousePos), true);
    });
    canvas.addEventListener('mousedown', (event) => {
        const camera = window.camera;
        if (cardsData.linkInProgress) {
            if (event.button == 0) {
                let id = cardsData.addDefaultCardHtml(camera.globalCoords(camera.mousePos), true);
                cardsData.endLink(id);
            }
            else cardsData.linkInProgress = false;
        }
        else camera.onMouseDown(event);
    });

    document.addEventListener('wheel', (event) => {
        event.preventDefault();
        window.camera.onWheel(event);
    }, { passive: false }
    );
}

window.onload = function () {
    Coloris({ clearButton: false });

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    window.camera = new util.Camera();
    let cardsData = new cards.CardsData();

    initListeners(canvas, cardsData);
    util.loadLocalSave(cardsData);

    cardsData.addCardsHTML();

    function main() {
        window.requestAnimationFrame(main);
        window.camera.update();

        // Clear canvas
        ctx.fillStyle = "#fff";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(200, 200, 200, 1)";
        ctx.lineWidth = 2 * window.camera.zoom;

        if (cardsData.linkInProgress) {
            let linkOriginElem = document.getElementById(`card-${cardsData.linkStart}`);
            util.drawLinkLine(ctx, linkOriginElem);
        }

        util.drawLinks(ctx, cardsData);
    }

    main(); // Start the cycle
};