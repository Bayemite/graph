const backgroundColor = '#181818';

let canvas = null;
let ctx = null;


let angle = 0;
let length = 1;

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

    function main(currentTime) {
        window.requestAnimationFrame(main);

        ctx.fillStyle = backgroundColor; // Background colour
        ctx.fillRect(0, 0, canvas.width, canvas.height);
ckLos

    }

    main(); // Start the cycle
};