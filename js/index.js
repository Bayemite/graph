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

    window.addEventListener('mousedown', function (e) {
        down = true
        initX = e.pageX, initY = e.pageY;
        dragX = e.pageX, dragY = e.pageY;
    });

    window.addEventListener('mousemove', function (e) {
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

    window.addEventListener('mouseup', function () {
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
    
    console.log(document.getElementById('card'))
    
    
    function main(currentTime) {
        window.requestAnimationFrame(main);
        
        zoom = lerp(zoom, zoomTarget, 0.05)

        ctx.fillStyle = backgroundColor; // Background colour
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        finalX = lerp(cameraPos.x, targetX, 0.25) * (zoom * 0.1)
        finalY = lerp(cameraPos.y, targetY, 0.25) * (zoom * 0.1)
        cameraPos.x = lerp(cameraPos.x, targetX, 0.25)
        cameraPos.y = lerp(cameraPos.y, targetY, 0.25)

        console.log(document.getElementsByClassName("object").length)
        
        for (let i = 0; i < document.getElementsByClassName("object").length; i++) {
            document.getElementById(`card-${i}`).style.transform = `translate(${cameraPos.x}px, ${cameraPos.y}px)`
        }

        // for (let i = 0; i < document.getElementsByClassName("object").length; i++) {
        //     document.getElementById(`card-${i}`).style.transform = `translate(${window.innerWidth / 2 + cameraPos.x}px, ${window.innerHeight / 2 + cameraPos.y}px)`
        // }

        document.getElementById("container").style.transform = `translate(${window.innerWidth / 2}px, ${window.innerHeight / 2}px) scale(${zoom / 20})`


    }

    main(); // Start the cycle
};