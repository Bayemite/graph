// Basically a file dump for extraneous definitions used in index.js

// return array of [r,g,b,a] from any valid color. if failed returns undefined
// https://stackoverflow.com/questions/34980574/how-to-extract-color-values-from-rgb-string-in-javascript
export function colorValues(color) {
    if (color === '')
        return;
    if (color.toLowerCase() === 'transparent')
        return [0, 0, 0, 0];
    if (color[0] === '#') {
        if (color.length < 7) {
            // convert #RGB and #RGBA to #RRGGBB and #RRGGBBAA
            color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + (color.length > 4 ? color[4] + color[4] : '');
        }
        return [parseInt(color.substr(1, 2), 16),
        parseInt(color.substr(3, 2), 16),
        parseInt(color.substr(5, 2), 16),
        color.length > 7 ? parseInt(color.substr(7, 2), 16) / 255 : 1];
    }
    if (color.indexOf('rgb') === -1) {
        // convert named colors
        var temp_elem = document.body.appendChild(document.createElement('fictum')); // intentionally use unknown tag to lower chances of css rule override with !important
        var flag = 'rgb(1, 2, 3)'; // this flag tested on chrome 59, ff 53, ie9, ie10, ie11, edge 14
        temp_elem.style.color = flag;
        if (temp_elem.style.color !== flag)
            return; // color set failed - some monstrous css rule is probably taking over the color of our object
        temp_elem.style.color = color;
        if (temp_elem.style.color === flag || temp_elem.style.color === '')
            return; // color parse failed
        color = getComputedStyle(temp_elem).color;
        document.body.removeChild(temp_elem);
    }
    if (color.indexOf('rgb') === 0) {
        if (color.indexOf('rgba') === -1)
            color += ',1'; // convert 'rgb(R,G,B)' to 'rgb(R,G,B)A' which looks awful but will pass the regxep below
        return color.match(/[\.\d]+/g).map(function (a) {
            return +a
        });
    }
}

export function checkArgs(args, paramCount) {
    if (args === null || args === undefined) { console.error("Call checkArgs with arguments object and arg count"); return; }
    if (args.length != paramCount) {
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
    constructor() {
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
    constructor() {
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
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

export class cardObject {
    constructor(x, y, t, c, colour) {
        this.x = x;
        this.y = y;
        this.title = t;
        this.connection = c;
        this.colour = colour;
    }
}

export class vector2D {
    constructor(x, y) {
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

function closeDialog(name) {
    document.getElementById(`dialog-${name}`).classList.add("dialog-remove");
    document.getElementById(`obstructor-${name}`).classList.add("obstructor-remove");
    setTimeout(function () {
        document.getElementById(`dialog-${name}`).parentElement.remove();
    }, 302);
}

export class Dialog {
    constructor(title, text, execute, message1, func, index, message2) {
        this.title = title;
        this.text = text;
        this.func;
        this.index;
        this.message1 = message1
        this.message2 = message2
        this.execute = execute
        if (this.execute) {
            this.func = func;
            this.index = index;
        }
    }

    show() {
        let dialog = document.createElement('div');
        dialog.innerHTML = `
        <div class="dialog" id="dialog-${this.title}">
            <h4 class="dialog-header">${this.title}</h4>
            <p class="dialog-content">${this.text}</p>
            <div class="dialog-button-container">
                <button id="dialog-button" class="dialog-button">${this.message1}</button>
                <button id="dialog-button-exec" style="display: ${!this.execute ? 'none' : 'inherit'}" class="dialog-button">${this.message2}</button>
            </div>
        </div>
        <div class="obstructor" id="obstructor-${this.title}">
        </div>
        `;
        document.getElementById("dialog-container").appendChild(dialog);
        document.getElementById('dialog-button').onclick = () => {
            closeDialog(this.title);
        };

        if (this.execute) {
            document.getElementById('dialog-button-exec').onclick = () => {
                this.func(this.index);
                closeDialog(this.title);
            };
        }

        document.getElementsByClassName('obstructor')[0].onclick = (e) => {
            e.stopImmediatePropagation()
            closeDialog(this.title);
        }
    }
}