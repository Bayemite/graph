import { Matrix } from './matrix.js';

// Basically a file dump for extraneous definitions

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

    peer() {
        return this.peer;
    }

    id() {
        return this.peer.id;
    }
}

// Should guarantee unique
export class IDAssign {
    constructor () {
        this.next = 0;
    }
    getNextId() {
        return this.next++;
    }
}

export class rgb {
    constructor (r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}


export class Vec2 {
    constructor (x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(vecAdd) {
        this.x += vecAdd.x;
        this.y += vecAdd.y;
        return this;
    }

    minus(vecMinus) {
        this.x -= vecMinus.x;
        this.y -= vecMinus.y;
        return this;
    }

    div(scalarDiv) {
        this.x /= scalarDiv;
        this.y /= scalarDiv;
        return this;
    }

    dist(x, y) {
        return Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
    }
}

export function vec2(x = 0, y = 0) {
    return new Vec2(x, y);
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

// Angle: Up = 0, positive is clockwise
export function drawTriangle(ctx, x, y, angle, radius) {
    let p1 = vec2();
    let p2 = vec2();
    let p3 = vec2();

    let rad = radius * window.camera.zoom;
    p1.x = rad * Math.sin(degreesToRadians(0 + angle)) + x;
    p2.x = rad * Math.sin(degreesToRadians(120 + angle)) + x;
    p3.x = rad * Math.sin(degreesToRadians(240 + angle)) + x;
    p1.y = -rad * Math.cos(degreesToRadians(0 + angle)) + y;
    p2.y = -rad * Math.cos(degreesToRadians(120 + angle)) + y;
    p3.y = -rad * Math.cos(degreesToRadians(240 + angle)) + y;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

function closeDialog(name) {
    document.getElementById(`dialog-${name}`).classList.add("dialog-remove");
    document.getElementById(`obstructor-${name}`).classList.add("obstructor-remove");
    setTimeout(function () {
        document.getElementById(`dialog-${name}`).parentElement.remove();
    }, 302);
}

function rectCenter(rect) {
    return vec2(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

// For relative distance comparison.
function squares(p0, p1) { return (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2; };

// Returns {pos: vec2, angle: number},
// pos: centre of side, angle: the side in positive degrees (0 is top, clockwise is positive)
function closestSideCenter(pos, rect) {
    const center = rectCenter(rect);

    // Both algorithms seem the same.
    let xDiff = pos.x - center.x;
    let yDiff = pos.y - center.y;
    // If longer horizontally: Choose left/right side.
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0)
            return { pos: vec2(rect.right, center.y), angle: 90 };
        else
            return { pos: vec2(rect.left, center.y), angle: 270 };
    }
    else {
        if (yDiff > 0)
            return { pos: vec2(center.x, rect.bottom), angle: 180 };
        else
            return { pos: vec2(center.x, rect.top), angle: 0 };
    }

    let sides = [ // top, right, bottom, left
        vec2(center.x, rect.top),
        vec2(rect.right, center.y),
        vec2(center.x, rect.bottom),
        vec2(rect.left, center.y)
    ];

    let minDist = squares(pos, sides[0]);
    const rDist = squares(pos, sides[1]);
    const bDist = squares(pos, sides[2]);
    const lDist = squares(pos, sides[3]);
    let i = 0;
    if (rDist < minDist) { minDist = rDist; i = 1; }
    if (bDist < minDist) { minDist = bDist; i = 2; }
    if (lDist < minDist) { i = 3; }

    return { pos: sides[i], angle: i * 90 };
}

// Arrow at end of link line
const linkTriangleRadius = 2;
function drawLinkTriangle(ctx, pos, angle) {
    drawTriangle(ctx, pos.x, pos.y, angle, linkTriangleRadius);
}

// Example: angle of 90
// startPos---cp0
//             |
//            cp1---endPos
function controlPoints(angle, startPos, endPos) {
    let cp0;
    let cp1;
    // If left/right side:
    if (angle === 90 || angle === 270) {
        const xDiff = endPos.x - startPos.x;
        const halfWayX = startPos.x + xDiff / 2;
        cp0 = vec2(halfWayX, startPos.y);
        cp1 = vec2(halfWayX, endPos.y);
    }
    else {
        const yDiff = endPos.y - startPos.y;
        const halfWayY = startPos.y + (yDiff) / 2;
        cp0 = vec2(startPos.x, halfWayY);
        cp1 = vec2(endPos.x, halfWayY);
    }
    return [cp0, cp1];
}

// Draws a line that is currently being connected by user (follows their mouse)
// ctx: canvas contex
// startElement: card element
export function drawLinkLine(ctx, startElement) {
    const endPos = window.camera.mousePos;
    const startBounds = startElement.getBoundingClientRect();
    const start = closestSideCenter(endPos, startBounds);
    const cp = controlPoints(start.angle, start.pos, endPos);

    ctx.beginPath();
    ctx.moveTo(start.pos.x, start.pos.y);
    ctx.bezierCurveTo(cp[0].x, cp[0].y, cp[1].x, cp[1].y, endPos.x, endPos.y);
    ctx.stroke();

    drawLinkTriangle(ctx, endPos, start.angle);
}

// Draws all existing links
export function drawLinks(ctx, cardsData) {
    for (let [rootId, root] of cardsData.cardsData) {
        if (root.connections.size == 0)
            continue;

        let rootTag = document.getElementById(`card-${rootId}`);
        if (rootTag == null) {
            console.log(`Root tag 'card-${rootId}' is null.`);
            continue;
        }

        for (let endId of root.connections.values()) {
            let endTag = document.getElementById(`card-${endId}`);
            if (endTag == null) {
                console.log(`End tag 'card-${endId}' is null.`);
                continue;
            }

            const rootBounds = rootTag.getBoundingClientRect();
            const endBounds = endTag.getBoundingClientRect();
            const endCenter = rectCenter(endBounds);
            const root = closestSideCenter(endCenter, rootBounds);
            let endPos = endCenter;

            let trianglePos = endPos;
            // So that pointy end of triangle is not clipped into endBounds.
            // TODO: maybe make drawLinkTriangle so that origin is a pointy point.
            const triOffset = (2 + linkTriangleRadius) * window.camera.zoom;
            // Make endPos be on centre of opposite side to startPos.
            if (root.angle == 0) {
                endPos.y = endBounds.bottom;
                trianglePos.y += triOffset;
            }
            else if (root.angle == 180) {
                endPos.y = endBounds.top;
                trianglePos.y -= triOffset;

            }
            else if (root.angle == 270) {
                endPos.x = endBounds.right;
                trianglePos.x += triOffset;

            }
            else if (root.angle == 90) {
                endPos.x = endBounds.left;
                trianglePos.x -= triOffset;
            }

            const cp = controlPoints(root.angle, root.pos, endPos);

            drawLinkTriangle(ctx, trianglePos, root.angle);
            ctx.beginPath();
            ctx.moveTo(root.pos.x, root.pos.y);
            ctx.bezierCurveTo(cp[0].x, cp[0].y, cp[1].x, cp[1].y, endPos.x, endPos.y);
            ctx.stroke();

            let unlinkTag = document.getElementById(`unlink-${rootId}-${endId}`);
            const unlinkBounds = unlinkTag.getBoundingClientRect();
            const unlinkSize = vec2(unlinkBounds.width, unlinkBounds.height);

            let unlinkTagPos = cp[0].add(cp[1]).div(2);
            unlinkTagPos.minus(unlinkSize.div(2)); // Move origin from top-left to centre
            unlinkTagPos = window.camera.globalCoords(unlinkTagPos);
            unlinkTag.style.left = unlinkTagPos.x + "px";
            unlinkTag.style.top = unlinkTagPos.y + "px";
        }
    }
}

export class Camera {
    #zoom = 1;
    #doScroll = false;
    #oldScrollPos = vec2();

    constructor () {
        this.mousePos = vec2();
        this.pos = vec2();

        this.matrix = new Matrix();
    }

    get zoom() {
        return this.matrix.a;
    }

    set zoom(scale) {
        this.#zoom = scale;
    }

    globalCoords(coords = vec2()) {
        let p = this.matrix.getInverse().applyToPoint(coords.x, coords.y);
        return vec2(p.x, p.y);
    }

    getTransformNode() {
        return document.getElementById('translate');
    }

    update() {
        // Zoom to center
        this.matrix.reset();
        this.matrix.translate(
            window.innerWidth / 2,//- deltaZoom * this.mousePos.x,
            window.innerHeight / 2  //- deltaZoom * this.mousePos.y
        );
        this.matrix.scale(this.#zoom, this.#zoom);
        // TODO: Pan at same ratio to zoom
        this.matrix.translate(this.pos.x, this.pos.y);

        let transformNode = this.getTransformNode();
        let m = this.matrix;
        transformNode.style.transform = `matrix(${m.a},${m.b},${m.c},${m.d},${m.e},${m.f})`;
    };

    onMouseMove(mousePos) {
        this.mousePos.x = mousePos.x;
        this.mousePos.y = mousePos.y;

        if (this.#doScroll) {
            let deltaX = this.mousePos.x - this.#oldScrollPos.x;
            let deltaY = this.mousePos.y - this.#oldScrollPos.y;
            this.pos.x += deltaX / this.#zoom;
            this.pos.y += deltaY / this.#zoom;
            this.#oldScrollPos.x = this.mousePos.x;
            this.#oldScrollPos.y = this.mousePos.y;
        }
    }

    onMouseDown(mousePos) {
        this.#doScroll = true;
        this.#oldScrollPos.x = mousePos.x;
        this.#oldScrollPos.y = mousePos.y;
        this.mousePos = mousePos;
    }

    onMouseUp() {
        this.#doScroll = false;
    }

    onWheel(event) {
        let delta = event.wheelDelta;
        const zoomFactor = 0.005;
        this.#zoom += delta * zoomFactor;

        const zoomOut = 0.3;
        const zoomIn = 3;
        this.#zoom = clamp(zoomOut, this.#zoom, zoomIn);
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
        camera.zoom = parsedData.camera.zoom;
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

export function getTheme() { return window.localStorage.getItem('theme'); }
export function setTheme(theme) { window.localStorage.setItem('theme', theme); }

export function updateTheme(theme) {
    // Edits css :root css variables
    let set = (key, val) => {
        let e = document.documentElement;
        val = window.getComputedStyle(e).getPropertyValue(val);
        e.style.setProperty(key, val);
    };

    set('--background-color', `--${theme}-background-color`);
    set('--text-color', `--${theme}-text-color`);
    set('--transparent-color', `--${theme}-transparent-color`);
    set('--border-color', `--${theme}-border-color`);
}

export function minSize(elem) {
    elem.style.minWidth = 'min-content';
    elem.style.minHeight = 'min-content';
    let minStyle = window.getComputedStyle(elem);
    let minW = parseInt(minStyle.width);
    let minH = parseInt(minStyle.height);

    return vec2(minW, minH);
}

export class Rect {
    constructor (x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

export function rect(x = 0, y = 0, width = 0, height = 0) {
    return new Rect(x, y, width, height);
}

// Helper function
export function styleRect(style) {
    let x = parseInt(style.left);
    let y = parseInt(style.top);
    let w = parseInt(style.width);
    let h = parseInt(style.height);

    return new Rect(x, y, w, h);
}

export function resizeAnchors(cardColor) {
    let NW = document.createElement('span');
    NW.classList.add('unselectable');
    NW.classList.add('resize-anchor');
    NW.innerText = '◤';
    NW.style = `
        color: ${cardColor};
        cursor: nwse-resize;
        position: absolute;
        inset: 0 auto auto 0;
        transform: translate(-50%, -50%)
    `;

    let SE = NW.cloneNode();
    SE.innerText = '◢';
    SE.style.inset = 'auto 0 0 auto';
    SE.style.transform = 'translate(50%, 50%)';

    let NE = NW.cloneNode();
    NE.innerText = '◥';
    NE.style.cursor = 'nesw-resize';
    NE.style.inset = '0 0 auto auto';
    NE.style.transform = 'translate(50%, -50%)';

    let SW = NE.cloneNode();
    SW.innerText = '◣';
    SW.style.inset = 'auto auto 0 0';
    SW.style.transform = 'translate(-50%, 50%)';

    // Keep NW NE SE SW index order
    return [NW, NE, SE, SW];
}

export function resizeBounds(drag, event, card) {
    let bounds = new Rect();

    let rect = card.getBoundingClientRect();
    let style = window.getComputedStyle(card);
    let prev = styleRect(style);

    // Delta calculations. Halved? --> half for width/height, half for x/y
    let delX = (x) => { return (event.pageX - x) / 2; };
    let delY = (y) => { return (event.pageY - y) / 2; };
    let dX = delX(rect.left);
    let dY = delY(rect.top);

    if (drag == 0) {
        bounds.x = prev.x + dX;
        bounds.y = prev.y + dY;
        bounds.width = prev.width - dX;
        bounds.height = prev.height - dY;
    }
    if (drag == 1) {
        dX = delX(rect.right);
        bounds.x = prev.x;
        bounds.y = prev.y + dY;
        bounds.width = prev.width + dX;
        bounds.height = prev.height - dY;
    }
    else {
        dY = delY(rect.bottom);
        if (drag == 2) {
            dX = delX(rect.right);
            bounds.x = prev.x;
            bounds.y = prev.y;
            bounds.width = prev.height + dX;
            bounds.height = prev.height + dY;
        }
        else if (drag == 3) {
            dX = delX(rect.left);
            bounds.x = prev.x + dX;
            bounds.y = prev.y;
            bounds.width = prev.width - dX;
            bounds.height = prev.height + dY;
        }
    }

    let min = minSize(card);
    // Simply not setting size when newSize < minSize
    // jolts the card position when the minimum size is reached.
    // So this is the correct option.
    if (bounds.width < min.x) { bounds.width = prev.width; bounds.x = prev.x; }
    if (bounds.height < min.y) { bounds.height = prev.height; bounds.y = prev.y; }

    return bounds;
}