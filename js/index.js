import * as util from './util.js';
import * as cards from './cards.js';

function initListeners(canvas, camera, cardsData) {
    util.addSaveOpenFileListeners(cardsData);
    util.loadLocalSave(cardsData);
    util.addLocalSaveListener();

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mouseup', () => {
        cardsData.moveFlag = false;
        camera.onMouseUp();
    });
    document.addEventListener('mousemove', (event) => {
        // Mouse events are up in card creation
        if (cardsData.moveFlag)
            cardsData.moveElem(camera);

        camera.onMouseMove(event);
    });

    canvas.addEventListener('dblclick', () => {
        cardsData.addDefaultCardHtml(camera.hoverPos());
    });
    canvas.addEventListener('mousedown', (event) => {
        if (cardsData.linkInProgress) {
            if (event.button == 0) {
                let id = cardsData.addDefaultCardHtml(camera.hoverPos());
                cardsData.endLink(id);
            }
            else cardsData.linkInProgress = false;

        }
        else camera.onMouseDown(event);
    });

    document.addEventListener('wheel', (event) => {
        event.preventDefault();
        camera.onWheel(event);
    }, { passive: false }
    );
}

window.onload = function () {
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    let camera = new util.Camera(canvas.width, canvas.height);
    let cardsData = new cards.CardsData();

    initListeners(canvas, camera, cardsData);

    cardsData.addCardsHTML();

    function main() {
        window.requestAnimationFrame(main);
        camera.update();

        // Clear canvas
        ctx.fillStyle = "#fff";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(200, 200, 200, 1)";
        ctx.lineWidth = 2 * camera.zoom;

        if (cardsData.linkInProgress) {
            let linkOriginElem = document.getElementById(`card-${cardsData.linkStart}`);
            util.drawLinkLine(ctx, linkOriginElem, camera);
        }

        for (let [cardId, card] of cardsData.cardsData) {
            if (card.connections.size == 0)
                continue;

            // Get element connecting to other element
            let elem = document.getElementById(`card-${cardId}`);
            if (elem == null) {
                console.log(`card-${cardId} is null`);
                continue;
            }

            util.drawLinks(ctx, cardId, card, elem, camera);
        }
    }

    main(); // Start the cycle
};