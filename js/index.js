const backgroundColor = '#181818';

let canvas = null;
let ctx = null;

let zoom = 10
let zoomScale = 0.001

// Main loop
window.onload = function () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    function resize() {
        // Resize the canvas to the screen
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.fillStyle = backgroundColor; // Background colour
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);

    resize();

    let cameraPos = new vector2D(0, 0)
    let down = false;
    let initX = 0, initY = 0;
    let dragX = 0, dragY = 0
    let deltaX = 0, deltaY = 0
    let finalX = 0, finalY = 0

    let targetX = 0, targetY = 0
    let mouse = new vector2D(0, 0);

    const container = document.getElementById("container")
    const canvasH = document.getElementById("canvas")

    canvas.addEventListener('mousedown', function (e) {
        down = true
        initX = e.pageX, initY = e.pageY;
        dragX = e.pageX, dragY = e.pageY;
    });

    canvas.addEventListener('mousemove', function (e) {
        // console.log(finalX)
        mouse.x = e.pageX
        mouse.y = e.pageY

        if (down == true) {
            // console.log(mouse.x, mouse.y)
            dragX = e.pageX;
            dragY = e.pageY;

            deltaX = dragX - initX, deltaY = dragY - initY;
            initX = e.pageX, initY = e.pageY;
            // console.log("X: " + dragX + " Y: " + dragY);
            // console.log("X: " + deltaX + " Y: " + deltaY);

            targetX += (deltaX / zoom) * 30
            targetY += (deltaY / zoom) * 30
        }
    });

    canvas.addEventListener('mouseup', function () {
        down = false

    });

    let zoomTarget = 20
    window.addEventListener('mousewheel', function (evt) {
        let delta = evt.wheelDelta
        zoomTarget += delta * 0.02
        if (zoomTarget <= 2) {
            zoomTarget = 2
        }
    });
    
    console.log(document.getElementById('card'));
    
    let lerpScale = 0.5;
    
    function main(currentTime) {
        window.requestAnimationFrame(main);
        
        zoom = lerp(zoom, zoomTarget, lerpScale);

        ctx.fillStyle = backgroundColor; // Background colour
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        finalX = lerp(cameraPos.x, targetX, lerpScale) * (zoom * 0.1);
        finalY = lerp(cameraPos.y, targetY, lerpScale) * (zoom * 0.1);
        cameraPos.x = lerp(cameraPos.x, targetX, lerpScale);
        cameraPos.y = lerp(cameraPos.y, targetY, lerpScale);

        console.log(document.getElementsByClassName("object").length)
        
        // for (let i = 0; i < document.getElementsByClassName("object").length; i++) {
        //     document.getElementById(`card-${i}`).style.transform = `translate(${cameraPos.x - getById(`card-${i}`).style.width / 2 * (zoom / 20)}px, ${cameraPos.y - getById(`card-${i}`).style.height / 2 * (zoom / 20)}px)`
        // }

        // for (let i = 0; i < document.getElementsByClassName("object").length; i++) {
        //     document.getElementById(`card-${i}`).style.transform = `translate(${window.innerWidth / 2 + cameraPos.x}px, ${window.innerHeight / 2 + cameraPos.y}px)`
        // }

        container.style.transform = `translate(${window.innerWidth / 2 + cameraPos.x * (zoom / 30)}px, ${window.innerHeight / 2 + cameraPos.y * (zoom / 30)}px) scale(${zoom / 20})`


    }

    main(); // Start the cycle
};