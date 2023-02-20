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
            return +a;
        });
    }
}

export function checkArgs(args, paramCount) {
    if (args === null || args === undefined) { console.error("Call checkArgs with arguments object and arg count"); return; }
    if (args.length != paramCount) {
        console.error(`Arg count does not match param count of ${paramCount}:`, args);
        return;
    }
    for (let i = 0;i < args.length;i++) {
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

    peer() {
        return this.peer;
    }

    id() {
        return this.peer.id;
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


export class Vector2D {
    constructor (x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

export function vec2(x = 0, y = 0) {
    return new Vector2D(x, y);
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
    let top = vec2();
    let bottomL = vec2();
    let bottomR = vec2();

    // let rad = (radius * 0) + (radius * (zoom * 0.01) * (1 - 0))
    let rad = radius * zoom;
    top.x = rad * Math.sin((0 + angle) * (Math.PI / 180)) + x;
    top.y = -rad * Math.cos((0 + angle) * (Math.PI / 180)) + y;

    bottomL.x = rad * Math.sin((120 + angle) * (Math.PI / 180)) + x;
    bottomL.y = -rad * Math.cos((120 + angle) * (Math.PI / 180)) + y;
    bottomR.x = rad * Math.sin((240 + angle) * (Math.PI / 180)) + x;
    bottomR.y = -rad * Math.cos((240 + angle) * (Math.PI / 180)) + y;

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
}

function closeDialog(name) {
    document.getElementById(`dialog-${name}`).classList.add("dialog-remove");
    document.getElementById(`obstructor-${name}`).classList.add("obstructor-remove");
    setTimeout(function () {
        document.getElementById(`dialog-${name}`).parentElement.remove();
    }, 302);
}

export class Dialog {
    constructor (title, text, execute, message1, func, index, message2) {
        this.title = title;
        this.text = text;
        this.func;
        this.index;
        this.message1 = message1;
        this.message2 = message2;
        this.execute = execute;
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
            e.stopImmediatePropagation();
            closeDialog(this.title);
        };
    }
}

// startElement: card element
// Draws a line that is currently being connected by user (follows their mouse)
export function drawLinkLine(ctx, startElement) {
    const camera = window.camera;
    // Get element connecting to other mouse
    let elem = startElement;
    let x2 = Math.floor(-elem.style.left.replace('px', '') * camera.zoom - camera.pos.x);
    let y2 = Math.floor(-elem.style.top.replace('px', '') * camera.zoom - camera.pos.y);

    let triRad = 4;
    let number = 5;
    let curveWidth = Math.floor(50 * camera.zoom);
    let limiter = 5; // Limiter before the line connection direction changes

    // Get other element
    let xr = -camera.mousePos.x;
    let yr = -camera.mousePos.y - triRad * 2 * camera.zoom;
    if (x2 < xr) {
        curveWidth = Math.floor(150 * camera.zoom) * clamp(0.1, (xr + elem.offsetWidth - x2) / camera.zoom / 500, 1);
        ctx.moveTo(-xr + (number * camera.zoom) - 2, -yr - (number / 2) * camera.zoom);
        ctx.bezierCurveTo(
            -xr + (number * camera.zoom) + curveWidth, -yr + (number / 2) * camera.zoom,
            -x2 - curveWidth, -y2 + (elem.offsetHeight / 2) * camera.zoom,
            -x2 + 1,
            -y2 + (elem.offsetHeight / 2) * camera.zoom
        );
        ctx.stroke();
        drawTriangle(ctx, -xr + (number * camera.zoom) - 2 + (triRad + 0.5) * camera.zoom, -yr - (number / 2) * camera.zoom, triRad, camera.zoom, '#fff', -90);
    }
    else if (-xr + (number) + (curveWidth * camera.zoom / limiter) > -x2 - (curveWidth * camera.zoom / limiter) && (-xr + (curveWidth * camera.zoom / limiter) < -x2 + (elem.offsetWidth * camera.zoom) + (curveWidth * camera.zoom / limiter))) {
        if (yr > y2) {
            curveWidth = Math.floor(150 * camera.zoom) * clamp(0.1, (yr - y2) / camera.zoom / 500, 1);
            ctx.moveTo(-xr + (number / 2 * camera.zoom) - 1, -yr + (number) * camera.zoom - 1);
            ctx.bezierCurveTo(-xr + (number / 2 * camera.zoom), -yr + (number) * camera.zoom + curveWidth,
                -x2 + (elem.offsetWidth / 2 * camera.zoom), -y2 - curveWidth,
                -x2 + (elem.offsetWidth / 2 * camera.zoom), -y2 + 1);
            ctx.stroke();
            drawTriangle(ctx, -xr + (number / 2 * camera.zoom) - 1, -yr + (number) * camera.zoom - 1 + (triRad + 0.5) * camera.zoom, triRad, camera.zoom, '#fff', 0);
        } else {
            curveWidth = Math.floor(150 * camera.zoom) * clamp(0.1, (y2 - yr) / camera.zoom / 500, 1);
            ctx.moveTo(-xr + (number / 2 * camera.zoom) - 1, -yr + 1);
            ctx.bezierCurveTo(-xr + (number / 2 * camera.zoom), -yr - curveWidth,
                -x2 + (elem.offsetWidth / 2 * camera.zoom), -y2 + (elem.offsetHeight * camera.zoom) + curveWidth,
                -x2 + (elem.offsetWidth / 2 * camera.zoom), -y2 + (elem.offsetHeight * camera.zoom) - 1);
            ctx.stroke();
            drawTriangle(ctx, -xr + (number / 2 * camera.zoom) - 1, -yr + 1 - (triRad + 0.5) * camera.zoom, triRad, camera.zoom, '#fff', 180);
        }
    }
    else {
        curveWidth = Math.floor(150 * camera.zoom) * clamp(0.1, (x2 - xr) / camera.zoom / 500, 1);
        ctx.moveTo(-xr + 1, -yr + (number / 2) * camera.zoom);
        ctx.bezierCurveTo(-xr - curveWidth, -yr + (number / 2) * camera.zoom,
            -x2 + (elem.offsetWidth * camera.zoom) + curveWidth, -y2 + (elem.offsetHeight / 2) * camera.zoom,
            -x2 + (elem.offsetWidth * camera.zoom) - 1, -y2 + (elem.offsetHeight / 2) * camera.zoom);
        ctx.stroke();
        drawTriangle(ctx, -xr + 1 - (triRad + 0.5) * camera.zoom, -yr + (number / 2) * camera.zoom, triRad, camera.zoom, '#fff', 90);
    }
    ctx.closePath();
}

// Draws all existing links
export function drawLinks(ctx, cardId, card, elem) {
    const camera = window.camera;

    let curveWidth = Math.floor(50 * camera.zoom); // Set default
    let limiter = 5; // Limiter before the line connection direction changes
    let triRad = 4;
    let x2 = Math.floor(-elem.style.left.replace('px', '') * camera.zoom - camera.pos.x);
    let y2 = Math.floor(-elem.style.top.replace('px', '') * camera.zoom - camera.pos.y);

    // Get other element
    for (let connection of card.connections.values()) {
        let root = document.getElementById(`card-${connection}`);
        let unlink = document.getElementById(`unlink-${cardId}-${connection}`);
        if (root == null) {
            console.log(`card-${connection} is null`);
            continue;
        }
        if (unlink == null) {
            console.log(`unlink-${cardId}-${connection} is null`);
            continue;
        }

        let xr = Math.floor(-root.style.left.replace('px', '') * camera.zoom - camera.pos.x);
        let yr = Math.floor(-root.style.top.replace('px', '') * camera.zoom - camera.pos.y);

        ctx.beginPath();
        if (-xr + (root.offsetWidth * camera.zoom) < -x2) {
            curveWidth = Math.floor(150 * camera.zoom) * clamp(0.1, (xr - x2) / camera.zoom / 500, 1);
            ctx.moveTo(-xr + (root.offsetWidth * camera.zoom) - 2, -yr + (root.offsetHeight / 2) * camera.zoom);
            ctx.bezierCurveTo(-xr + (root.offsetWidth * camera.zoom) + curveWidth, -yr + (root.offsetHeight / 2) * camera.zoom,
                -x2 - curveWidth, -y2 + (elem.offsetHeight / 2) * camera.zoom,
                -x2 + 1, -y2 + (elem.offsetHeight / 2) * camera.zoom);
            ctx.stroke();
            drawTriangle(ctx, -xr + (root.offsetWidth * camera.zoom) - 2 + (triRad + 0.5) * camera.zoom, -yr + (root.offsetHeight / 2) * camera.zoom, triRad, camera.zoom, '#fff', -90);
            unlink.style.left = `${((Math.floor(elem.style.left.replace('px', '')) + (Math.floor(root.style.left.replace('px', '')) + root.offsetWidth)) / 2) - unlink.offsetWidth / 2}px`;
            unlink.style.top = `${((Math.floor(elem.style.top.replace('px', '')) + (Math.floor(root.style.top.replace('px', '')) + root.offsetHeight)) / 2) - unlink.offsetHeight / 2}px`;
        }
        else if (-xr + (root.offsetWidth * camera.zoom) + (curveWidth * camera.zoom / limiter) > -x2 - (curveWidth * camera.zoom / limiter) && (-xr + (curveWidth * camera.zoom / limiter) < -x2 + (elem.offsetWidth * camera.zoom) + (curveWidth * camera.zoom / limiter))) {
            if (yr > y2) {
                curveWidth = Math.floor(150 * camera.zoom) * clamp(0.1, (yr - y2) / camera.zoom / 500, 1);
                ctx.moveTo(-xr + (root.offsetWidth / 2 * camera.zoom) - 1, -yr + (root.offsetHeight) * camera.zoom - 1);
                ctx.bezierCurveTo(-xr + (root.offsetWidth / 2 * camera.zoom), -yr + (root.offsetHeight) * camera.zoom + curveWidth,
                    -x2 + (elem.offsetWidth / 2 * camera.zoom), -y2 - curveWidth,
                    -x2 + (elem.offsetWidth / 2 * camera.zoom), -y2 + 1);
                ctx.stroke();
                drawTriangle(ctx, -xr + (root.offsetWidth / 2 * camera.zoom) - 1, -yr + (root.offsetHeight) * camera.zoom - 1 + (triRad + 0.5) * camera.zoom, triRad, camera.zoom, '#fff', 0);
                unlink.style.left = `${(((Math.floor(elem.style.left.replace('px', '')) + elem.offsetWidth / 2)) + (Math.floor(root.style.left.replace('px', '')) + root.offsetWidth / 2)) / 2 - unlink.offsetWidth / 2}px`;
                unlink.style.top = `${(((Math.floor(elem.style.top.replace('px', '')) + elem.offsetHeight) + (Math.floor(root.style.top.replace('px', '')))) / 2) - unlink.offsetHeight / 2}px`;

            }
            else {
                curveWidth = Math.floor(150 * camera.zoom) * clamp(0.1, (y2 - yr) / camera.zoom / 500, 1);
                ctx.moveTo(-xr + (root.offsetWidth / 2 * camera.zoom) - 1, -yr + 1);
                ctx.bezierCurveTo(-xr + (root.offsetWidth / 2 * camera.zoom), -yr - curveWidth,
                    -x2 + (elem.offsetWidth / 2 * camera.zoom), -y2 + (elem.offsetHeight * camera.zoom) + curveWidth,
                    -x2 + (elem.offsetWidth / 2 * camera.zoom), -y2 + (elem.offsetHeight * camera.zoom) - 1);
                ctx.stroke();
                drawTriangle(ctx, -xr + (root.offsetWidth / 2 * camera.zoom) - 1, -yr + 1 - (triRad + 0.5) * camera.zoom, triRad, camera.zoom, '#fff', 180);
                unlink.style.left = `${(((Math.floor(elem.style.left.replace('px', '')) + elem.offsetWidth / 2)) + (Math.floor(root.style.left.replace('px', '')) + root.offsetWidth / 2)) / 2 - unlink.offsetWidth / 2}px`;
                unlink.style.top = `${((Math.floor(elem.style.top.replace('px', '')) + (Math.floor(root.style.top.replace('px', '')) + root.offsetHeight)) / 2) - unlink.offsetHeight / 2}px`;

            }
        }
        else {
            curveWidth = Math.floor(150 * camera.zoom) * clamp(0.1, (x2 - xr) / camera.zoom / 500, 1);
            ctx.moveTo(-xr + 1, -yr + (root.offsetHeight / 2) * camera.zoom);
            ctx.bezierCurveTo(-xr - curveWidth, -yr + (root.offsetHeight / 2) * camera.zoom,
                -x2 + (elem.offsetWidth * camera.zoom) + curveWidth, -y2 + (elem.offsetHeight / 2) * camera.zoom,
                -x2 + (elem.offsetWidth * camera.zoom) - 1, -y2 + (elem.offsetHeight / 2) * camera.zoom);
            ctx.stroke();
            drawTriangle(ctx, -xr + 1 - (triRad + 0.5) * camera.zoom, -yr + (root.offsetHeight / 2) * camera.zoom, triRad, camera.zoom, '#fff', 90);
            unlink.style.left = `${(((Math.floor(elem.style.left.replace('px', '')) + elem.offsetWidth) + (Math.floor(root.style.left.replace('px', '')))) / 2) - unlink.offsetWidth / 2}px`;
            unlink.style.top = `${((Math.floor(elem.style.top.replace('px', '')) + (Math.floor(root.style.top.replace('px', '')) + root.offsetHeight)) / 2) - unlink.offsetHeight / 2}px`;

        }
        ctx.closePath();
    }
}

export class Camera {
    constructor () {
        this.zoom = 1;
        this.oldZoom = 1;

        this.mousePos = vec2();
        this.pos = vec2();

        this.doScroll = false;
        this.oldScrollPos = vec2();
    }

    globalCoords(coords = vec2()) {
        let x = (coords.x - this.pos.x) / this.zoom;
        let y = (coords.y - this.pos.y) / this.zoom;
        return vec2(x, y);
    }

    getTransformNode() {
        return document.getElementById('translate');
    }

    setZoom(zoom) { this.zoom = zoom; this.oldZoom = zoom; }

    update() {
        let zoomDelta = this.zoom - this.oldZoom;
        this.oldZoom = this.zoom;
        this.pos.x += zoomDelta * (window.innerWidth / 2 - this.mousePos.x);
        this.pos.y += zoomDelta * (window.innerHeight / 2 - this.mousePos.y);
        let transformNode = this.getTransformNode();
        transformNode.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px) scale(${this.zoom})`;
    };

    onMouseMove(event) {
        this.mousePos.x = event.pageX;
        this.mousePos.y = event.pageY;

        if (this.doScroll) {
            let deltaX = event.pageX - this.oldScrollPos.x;
            let deltaY = event.pageY - this.oldScrollPos.y;
            this.pos.x += deltaX;
            this.pos.y += deltaY;
            this.oldScrollPos.x = event.pageX;
            this.oldScrollPos.y = event.pageY;
        }
    }

    onMouseDown(event) {
        this.doScroll = true;
        this.oldScrollPos.x = event.pageX;
        this.oldScrollPos.y = event.pageY;
    }

    onMouseUp() {
        this.doScroll = false;
    }

    onWheel(event) {
        let delta = event.wheelDelta;
        const zoomFactor = 0.005;
        this.zoom += delta * zoomFactor;

        const zoomOut = 0.3;
        const zoomIn = 3;
        this.zoom = clamp(zoomOut, this.zoom, zoomIn);
    }
}

function tryParseJson(file) {
    let data;
    try {
        data = JSON.parse(file);

    } catch (error) {
        alert("Error: Failed to load JSON file.");
        console.log("Failed to parse file JSON.");
        return null;
    }
    return data;
}

// Function to download data to a file
// https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
function download(data, filename, type) {
    var file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function save(cardsData) {
    const camera = window.camera;
    let saveData = cardsData.genSave();
    saveData.camera = {
        pos: { x: camera.pos.x, y: camera.pos.y },
        zoom: camera.zoom
    };
    return saveData;
}

function load(cardsData, saveData) {
    let parsedData = tryParseJson(saveData);
    if (parsedData != null) {
        const camera = window.camera;
        cardsData.loadFromJSON(parsedData);
        camera.pos.x = parsedData.camera.pos.x;
        camera.pos.y = parsedData.camera.pos.y;
        camera.setZoom(parsedData.camera.zoom);
        return true;
    }
    else return false;
}

export function addSaveOpenFileListeners(cardsData) {
    const openFileElem = document.getElementById('openFile');
    const saveFileElem = document.getElementById('save');
    let fileReader = new FileReader();

    fileReader.onload = () => {
        if (load(cardsData, fileReader.result))
            cardsData.addCardsHTML();
    };

    openFileElem.oninput = () => {
        fileReader.readAsText(openFileElem.files[0]);
        openFileElem.value = '';
    };

    saveFileElem.onclick = () => {
        let saveData = save(cardsData);
        download(JSON.stringify(saveData), saveData.title, "application/json");
    };
}

export function addLocalSaveListener(cardsData) {
    window.addEventListener('beforeunload', () => {
        let saveData = save(cardsData);
        window.localStorage.setItem('localSave', JSON.stringify(saveData));
        console.log("Saved file to localStorage.");
    });
}

export function loadLocalSave(cardsData) {
    let localSave = window.localStorage.getItem('localSave');
    if (localSave) {
        if (!load(cardsData, localSave))
            return false;
        return true;
    }
    return false;
}