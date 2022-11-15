// Basically a file dump for extraneous definitions used in index.js

export function checkArgs(args, paramCount) {
    if (args === null || args === undefined) { console.error("Call checkArgs with arguments object and arg count"); return; }
    if(args.length != paramCount){
        console.error(`Arg count does not match param count of ${paramCount}:`, args);
        return;
    }
    for (let i = 0; i < args.length; i++) {
        if (args[i] === undefined || args[i] === null) {
            console.error(`Arg ${i} null or undefined:`, args);
            return;
        }
    }
}

export class PeerConnection {
    constructor () {
        this.peer = new Peer();
        this.peer.on('open', (id) => console.log('My peer ID is: ' + id));
        this.peer.on('connection', (conn) => console.log("Connected: " + conn));

        const connectionButton = document.getElementById('connect-button');
        connectionButton.onclick = function () { connect(document.getElementById('peer-id').innerHTML); };
    }

    connect(id) {
        this.peer.connect(id);
    }
}

export class IDAssign {
    constructor () {
        this.spare = [];
        this.next = 0;
    }
    getNextId() {
        if (this.spare.length > 0)
            return this.spare.shift();
        return this.next++;;
    }
    freeId(id) {
        this.spare.push(id);
    }
}

export class rgb {
    constructor (r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

export class cardObject {
    constructor (x, y, t, c, colour) {
        this.x = x;
        this.y = y;
        this.title = t;
        this.connection = c;
        this.colour = colour;
    }
}

export class vector2D {
    constructor (x, y) {
        this.x = x;
        this.y = y;
    }
}

/**
 *  @function lerp
 *  @param {Number} start number
 *  @param {Number} end number
 *  @param {Number} speed multiplier
 */
export function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

/**
 *  @function clamp
 *  @param {Number} bottom clamp bottom
 *  @param {Number} number number
 *  @param {Number} top clamp top
 */
export function clamp(a, x, b) {
    return Math.max(a, Math.min(x, b));
}

export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

export function getById(e) {
    return document.getElementById(e);
}

export function drawTriangle(ctx, x, y, radius, zoom, fill, angle) {
    this.x = x;
    this.y = y;

    let top = new vector2D(0, 0);
    let bottomL = new vector2D(0, 0);
    let bottomR = new vector2D(0, 0);

    // let rad = (radius * 0) + (radius * (zoom * 0.01) * (1 - 0))
    let rad = radius * zoom;
    top.x = rad * Math.sin((0 + angle) * (Math.PI / 180)) + x;
    top.y = -rad * Math.cos((0 + angle) * (Math.PI / 180)) + y;

    bottomL.x = rad * Math.sin((120 + angle) * (Math.PI / 180)) + x;
    bottomL.y = -rad * Math.cos((120 + angle) * (Math.PI / 180)) + y;
    bottomR.x = rad * Math.sin((240 + angle) * (Math.PI / 180)) + x;
    bottomR.y = -rad * Math.cos((240 + angle) * (Math.PI / 180)) + y;

    this.draw = function () {
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(bottomL.x, bottomL.y);
        ctx.lineTo(bottomR.x, bottomR.y);
        ctx.lineTo(top.x, top.y);
        ctx.closePath();
        ctx.strokeStyle = fill;
        ctx.stroke();
        ctx.fillStyle = fill;
        ctx.fill();
    };

    // this.update = function (x, y, zoom, angle, zoomScalar) {
    //     // ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    //     this.x = x
    //     this.y = y
    //     rad = (radius * zoomScalar) + (radius * (zoom * 0.01) * (1 - zoomScalar))
    //     top.x = rad * Math.sin((0 + angle) * (Math.PI / 180)) + x
    //     top.y = -rad * Math.cos((0 + angle) * (Math.PI / 180)) + y
    //     bottomL.x = rad * Math.sin((120 + angle) * (Math.PI / 180)) + x
    //     bottomL.y = -rad * Math.cos((120 + angle) * (Math.PI / 180)) + y
    //     bottomR.x = rad * Math.sin((240 + angle) * (Math.PI / 180)) + x
    //     bottomR.y = -rad * Math.cos((240 + angle) * (Math.PI / 180)) + y

    //     this.draw(zoom);
    // }


    this.draw();
}