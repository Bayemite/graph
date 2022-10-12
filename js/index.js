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

        console.log(mouse.x, mouse.y)
        if (down == true) {
            dragX = e.pageX
            dragY = e.pageY;
        }
    });

    window.addEventListener('mouseup', function () {
        down = false


    });
    
    function main(currentTime) {
        window.requestAnimationFrame(main);
        
        ctx.fillStyle = backgroundColor; // Background colour
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        finalX = lerp(cameraPos.x, targetX, 0.1) * (zoom * 0.1)
        finalY = lerp(cameraPos.y, targetY, 0.1) * (zoom * 0.1)
        cameraPos.x = lerp(cameraPos.x, targetX, 0.1)
        cameraPos.y = lerp(cameraPos.y, targetY, 0.1)
        

    }

    main(); // Start the cycle
};