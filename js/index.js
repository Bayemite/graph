class rgb {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

const backgroundColor = 'rgb(100, 150, 200)';

let canvas = null;
let ctx = null;

let zoomScale = 0.001;
let zoomTarget = 1.5;
let zoom = 1;

// RGB class in functions.js
let colorPalette = [
    new rgb(51, 153, 255),
    new rgb(0, 100, 210),
    new rgb(115, 230, 20),
    new rgb(0, 204, 136),
    new rgb(255, 170, 20),
]

// File structure
let data = [
    {
        title: "Title",
        x: 0,
        y: 0,
        connection: null,
        colour: 0, // References the id of the colour in colourPalette
        id: 0,
    },
    {
        title: "Other card",
        x: 300,
        y: 200,
        connection: 0,
        colour: 0,
        id: 1,
    }
]

function newCard(i, x, y) {
    return `
    <span id="card-${i}" style="left: ${Math.floor(x)}px; top: ${Math.floor(y)}px" class="object">
    <p contenteditable role="textbox" class="text"></p>
    </span>
    `
}

let add = false; // Add card
function addCard(x, y) {
    // Hardcoded solution for now
    // The textbox will always be placed with the default "Enter text" meaning its width will
    // always be the same
    // The width is 136, height is 79
    
    let i = document.getElementsByClassName("object").length
    document.getElementById("translate").innerHTML += newCard(i, x - 136/2, y - 79/2)
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

    let cameraPos = new vector2D(canvas.width / 2, canvas.height / 2)
    let mouseDown = false;
    let initX = 0, initY = 0;
    let dragX = 0, dragY = 0;
    let deltaX = 0, deltaY = 0;
    let finalX = 0, finalY = 0;

    let targetX = (canvas.width / 2) / zoom, targetY = (canvas.height / 2) / zoom;
    let mouse = new vector2D(0, 0);

    const container = document.getElementById("container");

    canvas.addEventListener('mousedown', function (e) {
        if (add) {
            addCard((mouse.x - cameraPos.x) / zoom, (mouse.y - cameraPos.y) / zoom)
            document.getElementById('add').classList.remove('selected')
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

    function main(currentTime) {
        window.requestAnimationFrame(main);

        let translateLerpScale = 0.9;

        zoom = lerp(zoom, zoomTarget, 0.3);
        cameraPos.x = lerp(cameraPos.x, targetX, translateLerpScale);
        cameraPos.y = lerp(cameraPos.y, targetY, translateLerpScale);
        container.style.transform = `translate(${cameraPos.x}px, ${cameraPos.y}px) scale(${zoom})`;

        // Template get position of cursor in "map space"
        // document.getElementById(`card-0`).style.left = `${(mouse.x - cameraPos.x) / zoom}px`
        // document.getElementById(`card-0`).style.top = `${(mouse.y - cameraPos.y) / zoom}px`

        // Zoom needs fixing, needs to be anchored in the middle of the screen not 0, 0
        // ctx.fillStyle = backgroundColor; // Background colour
        // ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Constants
        let curveWidth = Math.floor(50 * zoom)
        let limiter = 5; // Limiter before the line connection direction changes

        // Connection lines
        for (let i = 1; i < document.getElementsByClassName("object").length; i++) {
            curveWidth = Math.floor(50 * zoom) // Set default

            // Get element connecting to other element
            let elem = document.getElementById(`card-${i}`)
            let x2 = Math.floor(-elem.style.left.replace('px', '') * zoom - cameraPos.x)
            let y2 = Math.floor(-elem.style.top.replace('px', '') * zoom - cameraPos.y)

            // Get other element
            let root = document.getElementById(`card-0`)
            let xr = Math.floor(-root.style.left.replace('px', '') * zoom - cameraPos.x)
            let yr = Math.floor(-root.style.top.replace('px', '') * zoom - cameraPos.y)

            // Styling
            ctx.fillStyle = "#fff"
            ctx.strokeStyle = "rgba(200, 200, 200, 1)"
            ctx.lineWidth = 2 * zoom

            // These are like
            // Stuff that like
            // Works and like
            // yeah
            ctx.beginPath();
            if (-xr + (root.offsetWidth * zoom) < -x2) {
                curveWidth = Math.floor(50 * zoom) * clamp(0.1, (xr - x2) / 500, 1)
                ctx.moveTo(-xr + (root.offsetWidth * zoom) - 1, -yr + (root.offsetHeight / 2) * zoom);
                ctx.bezierCurveTo(-xr + (root.offsetWidth * zoom) + curveWidth, -yr + (root.offsetHeight / 2) * zoom, 
                -x2 - curveWidth, -y2 + (elem.offsetHeight / 2) * zoom, 
                -x2 + 1, -y2 + (elem.offsetHeight / 2) * zoom);
                ctx.stroke();
            } else if (-xr + (root.offsetWidth * zoom) + (curveWidth * zoom / limiter) > -x2 - (curveWidth * zoom / limiter) && (-xr + (curveWidth * zoom / limiter) < -x2 + (elem.offsetWidth * zoom) + (curveWidth * zoom / limiter))) {
                if (yr > y2) {
                    curveWidth = Math.floor(50 * zoom) * clamp(0.1, (yr - y2) / 500, 1)
                    ctx.moveTo(-xr + (root.offsetWidth / 2 * zoom) - 1, -yr + (root.offsetHeight) * zoom - 1);
                    ctx.bezierCurveTo(-xr + (root.offsetWidth / 2 * zoom), -yr + (root.offsetHeight) * zoom + curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 - curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + 1);
                    ctx.stroke();
                } else {
                    curveWidth = Math.floor(50 * zoom) * clamp(0.1, (y2 - yr) / 500, 1)
                    ctx.moveTo(-xr + (root.offsetWidth / 2 * zoom) - 1, -yr + 1);
                    ctx.bezierCurveTo(-xr + (root.offsetWidth / 2 * zoom), -yr - curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + (elem.offsetHeight * zoom) + curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + (elem.offsetHeight * zoom) - 1);
                    ctx.stroke();
                }
            } else {
                curveWidth = Math.floor(50 * zoom) * clamp(0.1, (x2 - xr) / 500, 1)
                ctx.moveTo(-xr + 1, -yr + (root.offsetHeight / 2) * zoom);
                ctx.bezierCurveTo(-xr - curveWidth, -yr + (root.offsetHeight / 2) * zoom,
                    -x2 + (elem.offsetWidth * zoom) + curveWidth, -y2 + (elem.offsetHeight / 2) * zoom,
                    -x2 + (elem.offsetWidth * zoom) - 1, -y2 + (elem.offsetHeight / 2) * zoom);
                ctx.stroke();
            }
        }
    }

    main(); // Start the cycle
};