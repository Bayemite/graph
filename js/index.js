const backgroundColor = '#181818';

let canvas = null;
let ctx = null;

let zoomScale = 0.001;
let zoomTarget = 2;
let zoom = 2;

let add = false; // Add card

function newCard(i, x, y) {
    return `
        <span id="card-${i}" style="left: ${x}px; top: ${y}px" class="object">
          <p contenteditable role="textbox" class="text">
            Test
          </p>
        </span>
        `
}

function addCard(x, y) {
    let i = document.getElementsByClassName("object").length
    console.log(i)
    document.getElementById("translate").innerHTML += newCard(i, x - canvas.width / 2, y - canvas.height / 2)
    card = document.getElementById(`card-${i}`)
}


// Main loop
window.onload = function () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    function resize() {
        // Resize the canvas to the screen
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // ctx.fillStyle = backgroundColor; // Background colour
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);

    resize();

    let cameraPos = new vector2D(0, 0)
    let mouseDown = false;
    let initX = 0, initY = 0;
    let dragX = 0, dragY = 0;
    let deltaX = 0, deltaY = 0;
    let finalX = 0, finalY = 0;

    let targetX = 0, targetY = 0;
    let mouse = new vector2D(0, 0);

    const container = document.getElementById("container");

    canvas.addEventListener('mousedown', function (e) {
        if (add) {
            addCard(e.pageX + cameraPos.x, e.pageY + cameraPos.y)
            console.log(e.pageX, e.pageY)
            add = false;
        } else {
            mouseDown = true;
            initX = e.pageX, initY = e.pageY;
            dragX = e.pageX, dragY = e.pageY;
        }
    });

    canvas.addEventListener('mousemove', function (e) {
        mouse.x = e.pageX;
        mouse.y = e.pageY;

        if (mouseDown) {

            dragX = e.pageX;
            dragY = e.pageY;

            deltaX = dragX - initX;
            deltaY = dragY - initY;
            initX = e.pageX;
            initY = e.pageY;
            targetX += deltaX;
            targetY += deltaY;
        }
    });

    canvas.addEventListener('mouseup', function () {
        mouseDown = false;

    });

    window.addEventListener('mousewheel', function (evt) {
        let delta = evt.wheelDelta;
        let zoomFactor = 0.007;
        zoomTarget += delta * zoomFactor;

        let zoomOut = 0.3;
        let zoomIn = 3;
        zoomTarget = clamp(zoomOut, zoomTarget, zoomIn);
    });

    console.log(document.getElementById('card'));

    function main(currentTime) {
        window.requestAnimationFrame(main);
            
        let translateLerpScale = 0.9;

        document.getElementById(`card-0`).style.left = `${mouse.x - cameraPos.x}px`

        cameraPos.x = lerp(cameraPos.x, targetX, translateLerpScale);
        cameraPos.y = lerp(cameraPos.y, targetY, translateLerpScale);
        zoom = lerp(zoom, zoomTarget, 0.3);
        container.style.transform = `translate(${cameraPos.x}px, ${cameraPos.y}px) scale(${zoom})`;
    }

    main(); // Start the cycle
};