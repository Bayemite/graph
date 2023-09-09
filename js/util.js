// Basically a catch-all file dump for extraneous definitions

import { CardObject, CardsData, getCardTag, getCardContent } from './cards.js';

export const defaultColor = '#C8C8C8';
export const defaultFontSize = 'initial';
export const fileSuffix = '.msgpack';

export function getTitleTag() {
    return document.getElementById("title");
}

export function getLinksContainer() {
    return document.querySelector('#links-svg');
}

export function clearLinksContainer() {
    getLinksContainer().innerHTML = '<g id="links-transform"></g>';
}

export function tag(type, html = '') {
    let t = document.createElement(type);
    t.innerHTML = html;
    return t;
}

export function tagSVG(type) {
    return document.createElementNS('http://www.w3.org/2000/svg', type);
}

export function newEvent(type, detail) {
    return new CustomEvent(type, { detail: detail });
}

// get a valid int, fallback if needed
export function getInt(str, fallback = 0) {
    let n = parseInt(str);
    if (Number.isNaN(n))
        n = fallback;
    return n;
}

// get a valid float, fallback if needed
export function getFloat(str, fallback = 0.0) {
    let n = parseFloat(str);
    if (Number.isNaN(n))
        n = fallback;
    return n;
}

// get a valid CSS color string, fallback if needed
export function getColor(str, fallback = defaultColor) {
    if (CSS.supports('color', str))
        return str;
    return fallback;
}

export function randomRGBColor(min = 0) {
    return 'rgb(' + Math.max(0, min + Math.floor(Math.random() * (256 - min))) + ',' + Math.max(0, min + Math.floor(Math.random() * (256 - min))) + ',' + Math.max(0, min + Math.floor(Math.random() * (256 - min))) + ')';
}

// get a valid CSS fontSize string
export function getFontSize(str, fallback = defaultFontSize) {
    if (CSS.supports('font-size', str))
        return str;
    return fallback;
}

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

// Events: 'change', whenever addUndoCmd or clear is called
// change event has property .type: String, either 'add' or 'clear'
export class UndoRedoStack extends EventTarget {
    constructor() {
        super();

        this.undoStack = [];
        this.redoStack = [];
    }

    hasUndo() { return this.undoStack.length > 0; }
    hasRedo() { return this.redoStack.length > 0; }
    nextUndo() { return this.undoStack[this.undoStack.length - 1]; }

    clear() {
        this.undoStack = [];
        this.redoStack = [];

        let event = newEvent('change', { type: 'clear' });
        this.dispatchEvent(event);
    }

    dispatchChange(cmd) {
        let event = newEvent('change', {
            type: 'add',
            cmd: cmd
        });
        this.dispatchEvent(event);
    }

    // cmd is {
    // undo: Function, redo: Function, 
    //
    // Metadata
    // data: passed to functions,
    // type: str,
    // id: str (target id)
    //
    // Status flag, set by class
    // isUndo: true (false if next action is redo)
    // }
    addUndoCmd(cmd) {
        cmd.isUndo = true;

        this.undoStack.push(cmd);
        this.dispatchChange(cmd);
        // TODO: perhaps clear the redo stack?
    }

    #addRedoCmd(cmd) {
        cmd.isUndo = false;

        this.redoStack.push(cmd);
        this.dispatchChange(cmd);
    }

    undo() {
        if (this.undoStack.length > 0) {
            let cmd = this.undoStack.pop();
            cmd.undo(cmd.data);
            this.#addRedoCmd(cmd);

            return true;
        }
        return false;
    }

    redo() {
        if (this.redoStack.length > 0) {
            let cmd = this.redoStack.pop();
            cmd.redo(cmd.data);
            this.addUndoCmd(cmd);

            return true;
        }
        return false;
    }
}

// Should guarantee unique
export class IDAssign {
    getNextId() {
        return crypto.randomUUID();
    }
}

export class rgb {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}


export class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(vecAdd) {
        return vec2(
            this.x + vecAdd.x,
            this.y + vecAdd.y
        );
    }

    minus(vecMinus) {
        return vec2(
            this.x - vecMinus.x,
            this.y - vecMinus.y
        );
    }

    div(scalarDiv) {
        return vec2(
            this.x / scalarDiv,
            this.y / scalarDiv
        );
    }

    dist(x, y) {
        return Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
    }

    equals(vec) {
        return this.x === vec.x && this.y === vec.y;
    }
}

export function vec2(x = 0, y = 0) {
    return new Vec2(x, y);
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
    // bodyTag : array or single tag for dialog content
    // btns: String label for close button OR 
    // an array of {
    //   label: String, 
    //   onclick : callback (undefined defaults to closing dialog, return false to keep dialog open),
    //   id: optional String (html id)
    // }
    constructor(title, bodyTag, btns, callbacks = { onshow: null, onclose: null }) {
        this.title = title;
        this.bodyTag = bodyTag;
        this.btns = btns;
        this.callbacks = callbacks;

        this.dialog = document.createElement('dialog');
        this.dialog.className = 'dialog';
        this.id = `dialog-${this.title}`;
        this.dialog.innerHTML = `
            <h4 class="dialog-header">${this.title}</h4>
            <div class="dialog-content"></div>
            <div class="dialog-button-container"></div>
        `;

        let content = this.dialog.getElementsByClassName('dialog-content')[0];
        if (bodyTag instanceof Array) {
            for (let t of bodyTag)
                content.appendChild(t);
        } else
            content.appendChild(bodyTag);

        this.dialog.onclose = () => {
            if (this.callbacks.onclose)
                this.callbacks.onclose();
            this.close();
        };

        let btnContainer = this.dialog.getElementsByClassName('dialog-button-container')[0];
        let addBtn = (label, onclick, id) => {
            let btn = document.createElement('button');
            btn.className = 'dialog-button';
            btn.innerText = label;
            if (id)
                btn.id = id;
            btn.tabIndex = 0;

            btn.onclick = () => this.close();
            if (onclick)
                btn.onclick = () => {
                    let ret = onclick();
                    if (ret !== false)
                        this.close();
                };

            btnContainer.appendChild(btn);
        };

        if (btns instanceof Array) {
            for (let el of btns)
                addBtn(el.label, el.onclick, el.id);
        }
        else
            addBtn(btns);
    }

    show() {
        document.getElementById("dialog-container").appendChild(this.dialog);
        this.dialog.focus();
        this.dialog.showModal();

        if (this.callbacks.onshow)
            this.callbacks.onshow();
    }

    close() {
        this.dialog.classList.add("dialog-remove");
        setTimeout(() => {
            this.dialog.remove();
        }, 302);
    }
}

// Angle: Up = 0, positive is clockwise
function triPoints(pos, angle, radius) {
    let p1 = vec2(pos.x, pos.y);
    let p2 = vec2(pos.x, pos.y);
    let p3 = vec2(pos.x, pos.y);

    let rad = radius * window.camera.zoom;
    p1.x += rad * Math.sin(degreesToRadians(0 + angle));
    p2.x += rad * Math.sin(degreesToRadians(120 + angle));
    p3.x += rad * Math.sin(degreesToRadians(240 + angle));
    p1.y -= rad * Math.cos(degreesToRadians(0 + angle));
    p2.y -= rad * Math.cos(degreesToRadians(120 + angle));
    p3.y -= rad * Math.cos(degreesToRadians(240 + angle));

    return [p1, p2, p3];
}

// Angle: Up = 0, positive is clockwise
function drawTriangle(ctx, pos, angle, radius) {
    let p = triPoints(pos, angle, radius);

    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    ctx.lineTo(p[1].x, p[1].y);
    ctx.lineTo(p[2].x, p[2].y);
    ctx.lineTo(p[0].x, p[0].y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

function rectCenter(rect) {
    return vec2(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function rectMatrixed(rect, mat) {
    let a = mat.applyToArray([rect.left, rect.top, rect.right, rect.bottom]);
    return DOMRect.fromRect({ x: a[0], y: a[1], width: a[2] - a[0], height: a[3] - a[1] });
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
const linkTriangleRadius = 3;
function drawLinkTriangle(ctx, pos, angle) {
    drawTriangle(ctx, pos, angle, linkTriangleRadius * window.camera.zoom);
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
        const halfWayY = startPos.y + yDiff / 2;
        cp0 = vec2(startPos.x, halfWayY);
        cp1 = vec2(endPos.x, halfWayY);
    }
    return [cp0, cp1];
}

// Draws a line that is currently being connected by user (follows their mouse)
// ctx: canvas contex
// startElement: card element
function drawLinkLine(ctx, startElement) {
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

// rootId, endId: card ids
function drawLink(rootId, endId) {
    const inverse = window.camera.matrix.getInverse();
    const rootTag = getCardTag(rootId);
    const endTag = getCardTag(endId);

    const rootBounds = rectMatrixed(rootTag.getBoundingClientRect(), inverse);
    const endBounds = rectMatrixed(endTag.getBoundingClientRect(), inverse);
    const endCenter = rectCenter(endBounds);
    const root = closestSideCenter(endCenter, rootBounds);
    let endPos = endCenter;

    let trianglePos = endPos;
    // So that pointy end of triangle is not clipped into endBounds.
    const triOffset = linkTriangleRadius;
    // Make endPos be on centre of opposite side to startPos.
    switch (root.angle) {
        case 0:
            endPos.y = endBounds.bottom;
            trianglePos.y += triOffset;
            break;
        case 180:
            endPos.y = endBounds.top;
            trianglePos.y -= triOffset;
            break;
        case 270:
            endPos.x = endBounds.right;
            trianglePos.x += triOffset;
            break;
        case 90:
            endPos.x = endBounds.left;
            trianglePos.x -= triOffset;
            break;
    }

    const cp = controlPoints(root.angle, root.pos, endPos);
    const tri = triPoints(trianglePos, root.angle, linkTriangleRadius);

    const linkId = `link-${rootId}_${endId}`;
    let linkG = document.getElementById(linkId);
    let linkPath, linkTri;
    if (linkG === null) {
        linkG = document.getElementById('links-transform').appendChild(tagSVG('g'));
        linkG.id = linkId;

        linkPath = linkG.appendChild(tagSVG('path'));
        linkPath.style.strokeWidth = '2px';
        linkPath.style.fill = 'none';

        linkTri = linkG.appendChild(tagSVG('polygon'));
    }
    linkPath = linkG.querySelector('path');
    linkTri = linkG.querySelector('polygon');

    let drawClr = getTheme() == 'dark' ? 'white' : 'black';
    linkTri.style.fill = drawClr;
    linkG.style.stroke = drawClr;

    linkPath.setAttribute('d', `M${root.pos.x},${root.pos.y} C${cp[0].x},${cp[0].y} ${cp[1].x},${cp[1].y} ${endPos.x},${endPos.y}`);
    linkTri.setAttribute('points', `${tri[0].x} ${tri[0].y}, ${tri[1].x} ${tri[1].y}, ${tri[2].x} ${tri[2].y}`);

    let unlinkTag = document.getElementById(`unlink-${rootId}_${endId}`);
    const unlinkBounds = rectMatrixed(unlinkTag.getBoundingClientRect(), inverse);
    const unlinkSize = vec2(unlinkBounds.width, unlinkBounds.height);

    let unlinkTagPos = cp[0].add(cp[1]).div(2);
    unlinkTagPos = unlinkTagPos.minus(unlinkSize.div(2)); // Move origin from top-left to centre
    unlinkTag.style.left = unlinkTagPos.x + "px";
    unlinkTag.style.top = unlinkTagPos.y + "px";
}

// Draws all existing links
function drawLinks(cardsData) {
    for (let [rootId, root] of cardsData.cardsData) {
        if (root.connections.size == 0)
            continue;

        for (let endId of root.connections.values())
            drawLink(rootId, endId);
    }
}

function drawSnapAxis(ctx, cardsData) {
    if (cardsData.snapAxis) {
        ctx.strokeStyle = 'lightgrey';
        ctx.lineWidth = 1;

        let draw = (fn) => {
            ctx.beginPath();
            fn();
            ctx.stroke();
        };

        let bounds = cardsData.getFocusedCard()?.getBoundingClientRect();
        if (!bounds) return;

        if (cardsData.snapAxis == 'x') {
            draw(() => {
                ctx.moveTo(0, bounds.top);
                ctx.lineTo(window.innerWidth, bounds.top);
            });
            draw(() => {
                ctx.moveTo(0, bounds.bottom);
                ctx.lineTo(window.innerWidth, bounds.bottom);
            });
        } else if (cardsData.snapAxis == 'y') {
            draw(() => {
                ctx.moveTo(bounds.left, 0);
                ctx.lineTo(bounds.left, window.innerHeight);
            });
            draw(() => {
                ctx.moveTo(bounds.right, 0);
                ctx.lineTo(bounds.right, window.innerHeight);
            });
        }
    }
}

export class Camera {
    #zoom = 1;
    #doScroll = false;
    #oldScrollPos = vec2();

    constructor(cardsData) {
        this.cardsData = cardsData;

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

    // Translate from DOM coords to application coords
    globalCoords(coords = vec2()) {
        let p = this.matrix.getInverse().applyToPoint(coords.x, coords.y);
        return vec2(p.x, p.y);
    }

    getTransformNode() {
        return document.getElementById('translate');
    }

    updateLink(id) {
        for (let endId of this.cardsData.get(id).connections.values())
            drawLink(id, endId);

        let endId = id;
        for (let [rootId, root] of this.cardsData.cardsData) {
            if (!root.connections.has(endId))
                continue;

            drawLink(rootId, endId);
        }
    }

    updateLinks() {
        drawLinks(this.cardsData);
    }

    updateCanvas() {
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = getStyle('--background-color');
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let theme = getTheme();
        if (theme == 'dark') {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'white';
        }
        else {
            ctx.fillStyle = 'black';
            ctx.strokeStyle = 'black';
        }

        ctx.lineWidth = 2 * window.camera.zoom;

        if (this.cardsData.linkInProgress) {
            let linkOriginElem = document.getElementById(`card-${this.cardsData.linkStart}`);
            drawLinkLine(ctx, linkOriginElem);
        }
        drawSnapAxis(ctx, this.cardsData);
    }

    update() {
        // Zoom to center
        this.matrix.reset();
        this.matrix.translate(
            window.innerWidth / 2,
            window.innerHeight / 2
        );
        this.matrix.scale(this.#zoom, this.#zoom);
        this.matrix.translate(this.pos.x, this.pos.y);

        let m = this.matrix;
        let transformNode = this.getTransformNode();
        transformNode.style.transform = `matrix(${m.a},${m.b},${m.c},${m.d},${m.e},${m.f})`;

        document.querySelector('#links-transform').setAttribute('transform',
            `matrix(${m.a},${m.b},${m.c},${m.d},${m.e},${m.f})`
        );

        this.updateCanvas();
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

        this.update();
    }

    onMouseDown(mousePos) {
        this.#doScroll = true;
        this.#oldScrollPos.x = mousePos.x;
        this.#oldScrollPos.y = mousePos.y;
        this.mousePos = mousePos;

        this.update();
    }

    onMouseUp() {
        this.#doScroll = false;
        this.update();
    }

    onWheel(event) {
        let delta = event.wheelDelta;
        const zoomFactor = 0.001;
        this.#zoom += delta * zoomFactor;

        const zoomOut = 0.3;
        const zoomIn = 3;
        this.#zoom = clamp(zoomOut, this.#zoom, zoomIn);

        this.update();
    }
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

async function save(cardsData, removeUnusedImages = true) {
    let saveData = await cardsData.genSave(removeUnusedImages);
    let bytes = msgpack.encode(saveData);
    return { bytes: bytes, title: saveData.title };
}

// cardsData: CardsData object, saveData: ArrayBuffer
function load(cardsData, saveData) {
    if (saveData.size == 0)
        return false;

    let parsedData;
    try {
        parsedData = msgpack.decode(new Uint8Array(saveData));
    }
    catch (e) {
        console.error(e);
        return false;
    }

    console.log("Deserialised save:", parsedData);
    cardsData.loadSave(parsedData);

    return true;
}

export function addExternSaveFileListeners(cardsData, localSaver) {
    const openFileElem = document.getElementById('import');
    const downloadFileElem = document.getElementById('export');

    openFileElem.oninput = async () => {
        let file = openFileElem.files[0];
        let arr = await file.arrayBuffer();

        let newCards = new CardsData();
        if (load(newCards, arr)) {
            let id = await localSaver.createNewSave(newCards);
            window.open(`index.html?id=${id}`);
        }

        openFileElem.value = '';
    };
    let openBtn = document.getElementById('open');
    openBtn.onclick = () => openFileElem.click();


    downloadFileElem.onclick = async () => {
        let saveData = await save(cardsData);

        let title = saveData.title;
        if (title == '')
            title = 'Untitled';

        download(saveData.bytes, title + fileSuffix, "application/msgpack");
    };
}

// helper function for init.
export async function localSaver(cardsData, dashboardTag) {
    let instance = new LocalSaver();
    await instance.init(cardsData, dashboardTag);
    return instance;
}

// Saves using localforage
class LocalSaver {
    async init(cardsData, dashboardTag) {
        this.cardsData = cardsData;
        this.id = await this.#validSearchParamId();

        this.statusTag = document.getElementById('save-status');
        this.saveDebounce = null;

        this.dashboardTag = dashboardTag;
        this.snapshotsUpdated = new BroadcastChannel('snapshots-updated');
    }

    async #getSnapshots() {
        const key = 'dashboard-data';

        let shots = await localforage.getItem(key);
        if (shots === null)
            shots = {};

        return shots;
    }

    async #updateSnapshots(snapshots) {
        const key = 'dashboard-data';
        this.snapshotsUpdated.postMessage('updated');

        // ! await ordering
        await localforage.setItem(key, snapshots);
        await this.#updateDash(this.dashboardTag);
    }

    async deleteSnapshot(id) {
        let shots = await this.#getSnapshots();

        delete shots[id];

        await this.#updateSnapshots(shots);
    }

    async updateTitleSnapshot(id = null, title = null) {
        if (id === null)
            id = this.id;
        if (title === null)
            title = getTitleTag().value;

        let shots = await this.#getSnapshots();
        let shot = shots[id];

        shots[id] = {
            title: title,
            snapshot: shot?.snapshot
        };

        await this.#updateSnapshots(shots);
    }

    // snapshot: png blob
    async updateFileSnapshot(snapshot) {
        if (this.id === null)
            return;

        let shots = await this.#getSnapshots();
        let shot = shots[this.id];

        shots[this.id] = {
            title: shot?.title,
            snapshot: snapshot
        };

        await this.#updateSnapshots(shots);
    }

    async #updateDash() {
        let shots = await this.#getSnapshots();
        if (shots === null)
            return;

        this.dashboardTag.innerHTML = '';

        for (let [id, snapshot] of Object.entries(shots)) {
            let imgSrc = '';
            if (snapshot.snapshot)
                imgSrc = URL.createObjectURL(snapshot.snapshot);

            snapshot.title = snapshot.title?.trim();
            if (!snapshot.title || snapshot.title == '')
                snapshot.title = 'Untitled';

            let snapshotTag = document.createElement('a');
            snapshotTag.href = `index.html?id=${id}`;
            snapshotTag.innerHTML = `
                <img class="file-desc-img" src="${imgSrc}">
                <div class="file-desc">
                    ${snapshot.title}
                </div>
            `;

            const awaitOnDelete = true;
            let ondelete = (e) => {
                e.preventDefault();

                let onresolve = resolve => {
                    const btns = [
                        {
                            label: 'No',
                            onclick: () => resolve(false)
                        },
                        {
                            label: 'Yes',
                            onclick: () => {
                                resolve(true);
                                this.#delete(id);
                            }
                        }
                    ];

                    let confirmDelete = new Dialog(
                        'Delete Map?',
                        tag('p', 'This is permanent.'),
                        btns
                    );
                    confirmDelete.show();
                };

                return new Promise(onresolve);
            };
            addRemoveBtn(snapshotTag, {}, ondelete, awaitOnDelete);

            this.dashboardTag.appendChild(snapshotTag);
        }
    }

    // Updates as needed by broadcast channel signal
    async loadDashboardListener() {
        await this.#updateDash();
        this.snapshotsUpdated.onmessage = async () => await this.#updateDash();
    }

    // Returns null if invalid, use nextId
    async #validSearchParamId() {
        let params = new URLSearchParams(window.location.search);

        let id = params.get('id');
        let nextId = await localforage.getItem('next-save-id');

        // avoid future overwriting
        if (id < 0 || id > Number(nextId)) {
            history.replaceState(null, '', 'index.html');
            id = null;
        }

        return id;
    }

    async #nextId() {
        let id = await localforage.getItem('next-save-id');
        if (id === null)
            id = 0;
        await localforage.setItem('next-save-id', Number(id) + 1);
        return id;
    }

    async #write(id = null, cardsData = null, statusTag = this.statusTag, removeUnusedImages = true) {
        if (id === null)
            id = this.id;
        if (id === null)
            return;

        if (cardsData === null)
            cardsData = this.cardsData;

        if (statusTag)
            statusTag.innerText = 'Saving...';

        let saveData = await save(cardsData, removeUnusedImages);
        localforage.setItem(id.toString(), saveData.bytes).then(() => {
            cardsData.dirty = false;
            if (statusTag)
                statusTag.innerText = 'Saved';
        });
    };

    async #delete(id) {
        await localforage.removeItem(id);
        await this.deleteSnapshot(id);

        if (id === this.id) {
            this.cardsData = new CardsData();
            this.cardsData.dirty = false;
            window.location.href = `index.html`;
        }
    }

    async save() {
        // Initialise if this is first change
        // INVARIANT: 'avoid future overwriting'
        // this.id >= 0 and < localStorage 'next-save-id'
        if (this.id === null)
            this.id = await this.#nextId();
        history.replaceState(null, '', 'index.html?id=' + this.id);

        await this.updateTitleSnapshot();

        await this.#write();
    }

    // Will debounce until 500ms delay
    #autosave() {
        if (!this.cardsData.dirty)
            return;

        const debounce = 500;
        clearTimeout(this.saveDebounce);

        this.saveDebounce = setTimeout(async () => {
            await this.save();
        }, debounce);
    };

    async createNewSave(data = new CardsData()) {
        let id = await this.#nextId();

        const removeUnusedImages = false;
        await this.#write(id, data, null, removeUnusedImages);

        this.updateTitleSnapshot(id, 'Untitled');

        return id;
    }

    // load an existing save
    async loadLocalSave() {
        if (this.id === null)
            return;

        const savedata = await localforage.getItem(this.id);
        if (savedata === null)
            return;

        if (load(this.cardsData, savedata))
            this.statusTag.innerText = 'Saved';
    }

    // Save beforeunload, and after changes (calls save())
    addLocalSaveListeners() {
        window.addEventListener('beforeunload', (e) => {
            if (this.cardsData.dirty) {
                let written = false;
                console.log(this.cardsData.dirty);
                this.#write().then(() => written = true);
                if (!written)
                    e.preventDefault();
            }
        });

        this.cardsData.undoRedoStack.addEventListener('change', (e) => {
            this.statusTag.innerText = 'Unsaved';
            if (e.detail.type == 'add')
                this.#autosave();
        });
    }
}

export function getTheme() { return window.localStorage.getItem('theme'); }
export function setTheme(theme) { window.localStorage.setItem('theme', theme); }

export function setStyle(key, val) {
    let e = document.documentElement;
    if (val.startsWith('--'))
        val = window.getComputedStyle(e).getPropertyValue(val);
    e.style.setProperty(key, val);
};
export function getStyle(key) {
    let e = document.documentElement;
    return window.getComputedStyle(e).getPropertyValue(key);
}

export function updateTheme(cardsData) {
    // Edits css :root css variables

    let theme = getTheme();
    if (theme == null) { theme = 'dark'; setTheme(theme); }

    setStyle('--background-color', `--${theme}-background-color`);
    setStyle('--text-color', `--${theme}-text-color`);
    setStyle('--transparent-color', `--${theme}-transparent-color`);
    setStyle('--border-color', `--${theme}-border-color`);
    setStyle('--sidebar-color', `--${theme}-sidebar-color`);

    cardsData.updateColors();
    window.camera.updateLinks();
    window.camera.updateCanvas();

    Coloris({
        themeMode: theme
    });
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
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    equals(rect = new Rect()) {
        return (
            this.x === rect.x &&
            this.y === rect.y &&
            this.width === rect.width &&
            this.height === rect.height
        );
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

export function computedStyleRect(tag) {
    let style = window.getComputedStyle(tag);
    return styleRect(style);
}

class ResizeAnchors extends EventTarget {
    // anchors for each corner
    constructor(NW, NE, SE, SW, parentTag) {
        super();

        this.parent = parentTag;
        this.tag = tag('div');
        this.current = -1;

        this.tag.append(NW, NE, SE, SW);
        this.parent.append(this.tag);

        let resizeAnchors = [NW, NE, SE, SW];
        for (let i = 0; i < resizeAnchors.length; i++) {
            let a = resizeAnchors[i];
            a.onmousedown = (e) => {
                e.stopPropagation();
                this.current = i;

                let event = newEvent('mousedown', { index: i });
                this.dispatchEvent(event);
            };
        }

        this.onmousemove = (e) => {
            if (this.current == -1)
                return;

            let event = newEvent('resize',
                { bounds: resizeBounds(this.current, e, this.parent) }
            );
            this.dispatchEvent(event);
        };
        this.onmouseup = () => this.current = -1;
        document.addEventListener('mouseup', this.onmouseup);
        document.addEventListener('mousemove', this.onmousemove);
    }
}

export function resizeAnchors(color, tag) {
    let NW = document.createElement('span');
    NW.classList.add('unselectable');
    NW.classList.add('resize-anchor');
    NW.innerText = '◤';
    NW.style = `
        color: ${color};
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

    return new ResizeAnchors(NW, NE, SE, SW, tag);
}

export function resizeBounds(anchorIndex, event, tag) {
    let bounds = new Rect();

    let rect = tag.getBoundingClientRect();
    let prev = computedStyleRect(tag);

    // Delta calculations. Halved? --> half for width/height, half for x/y
    let delX = (x) => { return Math.round((event.pageX - x) / 2); };
    let delY = (y) => { return Math.round((event.pageY - y) / 2); };
    let dX = delX(rect.left);
    let dY = delY(rect.top);

    if (anchorIndex == 0) {
        bounds.x = prev.x + dX;
        bounds.y = prev.y + dY;
        bounds.width = prev.width - dX;
        bounds.height = prev.height - dY;
    }
    else if (anchorIndex == 1) {
        dX = delX(rect.right);
        bounds.x = prev.x;
        bounds.y = prev.y + dY;
        bounds.width = prev.width + dX;
        bounds.height = prev.height - dY;
    }
    else {
        dY = delY(rect.bottom);
        if (anchorIndex == 2) {
            dX = delX(rect.right);
            bounds.x = prev.x;
            bounds.y = prev.y;
            bounds.width = prev.width + dX;
            bounds.height = prev.height + dY;
        }
        else if (anchorIndex == 3) {
            dX = delX(rect.left);
            bounds.x = prev.x + dX;
            bounds.y = prev.y;
            bounds.width = prev.width - dX;
            bounds.height = prev.height + dY;
        }
    }

    let min = minSize(tag);
    // dX/Y is half the required distance to min. size (acceptable)
    // for the drag types not handled in the inner if statements.
    if (bounds.width < min.x) {
        dX = Math.round((prev.width - min.x) / 2);
        if (anchorIndex == 0 || anchorIndex == 3) {
            bounds.width = prev.width - dX;
            bounds.x = prev.x + dX;
        }
    }
    if (bounds.height < min.y) {
        dY = Math.round((prev.height - min.y) / 2);
        if (anchorIndex == 0 || anchorIndex == 1) {
            bounds.height = prev.height - dY;
            bounds.y = prev.y + dY;
        }
    }

    return bounds;
}

export class CaretPos {
    constructor(node, offset) {
        this.node = node;
        this.offset = offset;
    }

    equals(otherCaretPos) {
        return (
            otherCaretPos.node?.isSameNode(this.node) &&
            otherCaretPos.offset == this.offset
        );
    }
};

export function getCaretPos() {
    let selection = window.getSelection();
    return new CaretPos(selection.anchorNode, selection.anchorOffset);
}

// undoStack: object of class UndoRedoStack
// elem: a contenteditable tag
// data: an object for storage of undo metadata (unique for the element)
//       data.text will contain the innerHTML
// options: {
//  onupdate: called whenever data.text is updated with innerHTML,
//  id: string to pass to undo command
// }
// returns {
//  hide(callback): function, calls callback without undo handler observing, 
//  stop(): function, stop undo handling
// }
export function addUndoHandler(undoStack, elem, data, options = {}) {
    data.text = elem.innerHTML;
    let updateData = () => {
        data.text = elem.innerHTML;
        if (options.onupdate)
            options.onupdate();
    };

    data.start = new CaretPos();
    let start = data.start;

    elem.addEventListener('beforeinput', () => start = getCaretPos());

    let observeEdits = (o) => {
        o.observe(elem, {
            subtree: true,
            childList: true,
            characterData: true,
        });
    };
    let hideFromObserver = (func) => {
        o.disconnect();
        func();
        observeEdits(o);
    };

    let handleMutation = (mut) => {
        let end = getCaretPos();

        let text = elem.innerHTML;
        let oldText = data.text;

        // Spaces fire 2x mutations, ignore the 2nd
        // Also who cares if its exactly the same
        if (text === oldText) return;

        if (end.node) {
            hideFromObserver(() => {
                for (let e of elem.getElementsByClassName('caret-anchor'))
                    e.remove();

                // don't add caret-anchor if empty
                if (elem.childNodes.length > 0) {
                    let r = new Range();
                    r.setStart(end.node, end.offset);

                    let c = document.createElement('span');
                    c.className = 'caret-anchor';

                    r.insertNode(c);
                }
            });
        }

        let restoreCaret = () => {
            let anchor = elem.getElementsByClassName('caret-anchor')[0];
            document.getSelection().setPosition(anchor, 0);
        };

        updateData();

        let undo = undoStack.nextUndo();
        let addUndo = true;
        if (undo?.type === 'html-edit') {
            // merge consecutive character inserts
            let charCount = end.offset - start.offset;
            let extendsEnd = start.equals(undo.data.end);

            if (extendsEnd && charCount == 1) {
                undo.data.end = end;
                undo.data.text = text;
                addUndo = false;
                undoStack.dispatchChange(undo);
            }
        }

        if (addUndo) {
            // TODO: merge oldText with newTexts
            undoStack.addUndoCmd({
                type: 'html-edit',
                id: options.id,
                data: {
                    start: start,
                    end: end,
                    text: text,
                    oldText: oldText,
                },
                undo: (data) => {
                    hideFromObserver(() => {
                        elem.innerHTML = data.oldText;
                        updateData();
                        restoreCaret();
                    });
                },
                redo: (data) => {
                    hideFromObserver(() => {
                        elem.innerHTML = data.text;
                        updateData();
                        restoreCaret();
                    });
                }
            });
        }

    };

    let o = new MutationObserver(
        (mList, o) => mList.forEach(mut => handleMutation(mut, o))
    );
    observeEdits(o);

    return { hide: hideFromObserver, stop: () => o.disconnect() };
}

// id: string --> is open (bool)

const sidebarMap = {
    "file-sidebar": "menu",
    "image-sidebar": "image-button",
    "peer-sidebar": "peer-button"
};

export class sidebar {
    static sidebars = new Map();

    static open(id, buttonId) {
        for (let [sidebarId, isOpen] of this.sidebars) {
            if (isOpen) {
                this.close(sidebarId, sidebarMap[sidebarId]);
            }
        }

        this.sidebars.set(id, true);
        document.getElementById(id).classList.add('visible');
        document.getElementById(buttonId).classList.add('visible-button');
    }

    static close(id, buttonId) {
        this.sidebars.set(id, false);
        document.getElementById(id).classList.remove('visible');
        document.getElementById(buttonId).classList.remove('visible-button');
    }

    static toggle(id) {
        let buttonId = sidebarMap[id];
        let isOpen = this.sidebars.get(id);

        if (isOpen) {
            this.close(id, buttonId);
        } else {
            this.open(id, buttonId);
        }

        this.sidebars.set(id, !isOpen);
    }
}


export function addImageListeners(cardsData) {
    let openImgBtn = document.getElementById('load-img-button');
    openImgBtn.onclick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.setAttribute('multiple', 'true');

        input.onchange = () => {
            for (let file of input.files)
                cardsData.addImage(-1, file);
        };
        input.click();
    };

    let imgBtn = document.getElementById('image-button');
    imgBtn.onclick = () => sidebar.toggle('image-sidebar');
}

// Add an x remove btn
// tag: that you want the remove btn on (class 'delete-btn-parent' is added)
// focusedTag: object reference, will store the currently focused html tag (mouse hover)
// onclick: callback before delete (return false to cancel delete)
// awaitOnClick: true if should await the onclick callback
export function addRemoveBtn(tag, focusedTag = {}, onclick = null, awaitOnClick = false) {
    tag.classList.add('delete-btn-parent');
    const className = 'delete-btn';

    tag.onmouseleave = () => {
        if (focusedTag)
            focusedTag.getElementsByClassName(className)[0].remove();
    };

    tag.onmouseenter = () => {
        let deleteBtn = document.createElement('button');
        deleteBtn.className = className;
        deleteBtn.innerHTML = `
            <span class="material-symbols-outlined">
                close
            </span>
        `;

        deleteBtn.onclick = async (e) => {
            if (onclick) {
                let proceed;
                if (awaitOnClick)
                    proceed = await onclick(e);
                else
                    proceed = onclick(e);

                if (proceed === false)
                    return;
            }

            if (focusedTag && tag.isSameNode(focusedTag))
                focusedTag = null;
            tag.remove();
        };

        tag.appendChild(deleteBtn);
        focusedTag = tag;
    };

}

async function getSettings() {
    let settings = await localforage.getItem('settings');
    if (settings === null) {
        settings = {
            animations: true
        };
    }

    return settings;
}

async function setSettings(settings) {
    await localforage.setItem('settings', settings);
}

// tag: from settingsTag(), extract the JS object representation
function extractSettings(tag) {
    let settings = {};
    settings.animations = tag.querySelector('#enable-anims').checked;

    return settings;
}

// tag: settingsTag configuration, null to take straight from localforage
export async function loadSettings(tag = null) {
    let settings;
    if (tag) {
        settings = extractSettings(tag);
        await setSettings(settings);
    }
    else
        settings = await getSettings();


    document.getElementById('animations-stylesheet').disabled = !settings.animations;
}

export async function settingsTag() {
    let settings = await getSettings();

    let t = tag(
        'div',
        `
            <label for="enable-anims">Animations</label>
            <input id="enable-anims" name="enable-anims" type="checkbox">
        `
    );
    t.id = 'settings';

    let anims = t.querySelector('#enable-anims');
    anims.checked = settings.animations;

    return t;
}

export class PeerManager {
    #makePeer() {
        return new Peer('', {
            secure: true,
            debug: 1
        });
    }

    constructor(cardsData, localSaver) {
        this.cardsData = cardsData;
        this.localSaver = localSaver;

        this.collabTag = document.querySelector('#collab-link');
        this.hostBtn = document.querySelector('#host-button');
        this.peerList = document.querySelector('#peer-list');
        this.peerCursors = document.querySelector('#peer-cursors');

        this.localPeer = null;
        this.peerName = '';

        this.hosting = false;
        this.connected = false;
        // id (.peer) -> Peer object
        this.connections = new Map();

        let params = new URLSearchParams(window.location.search);
        this.hostId = params.get('hostId');
        this.hostConn = null;

        if (this.hostId) {
            this.localPeer = this.#makePeer();

            let askUsername = async () => {
                let onresolve = resolve => {
                    let usernameInput = tag('input', '');
                    usernameInput.placeholder = 'Username';
                    usernameInput.onkeydown = (e) => {
                        if (e.key === "Enter")
                            document.querySelector('#ok-peer-username').click();
                    };

                    const btns = [{
                        label: 'Ok',
                        onclick: () => resolve(usernameInput.value),
                        id: 'ok-peer-username'
                    }];

                    let peerNameDialog = new Dialog(
                        'Collaboration',
                        [tag('p', 'Choose a peer username.'), usernameInput],
                        btns,
                        {
                            onshow: () => usernameInput.focus(),
                            onclose: () => resolve(usernameInput.value)
                        }
                    );
                    peerNameDialog.show();
                };

                return new Promise(onresolve);
            };

            this.localPeer.on('open', async () => {
                this.peerName = await askUsername();
                this.hostConn = this.localPeer.connect(
                    this.hostId, { label: this.peerName, reliable: true }
                );

                this.hostConn.on('open', () => this.onHostOpen());
                this.hostConn.on('data', (data) => this.onHostData(data));
            });
        }
    }

    initListeners() {
        this.collabTag.onpointerdown = () => {
            this.collabTag.select();
            this.collabTag.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(this.collabTag.value);
        };

        this.hostBtn.onclick = () => {
            if (this.hosting) {
                this.hosting = false;

                for (let dataConn of this.connections.values())
                    dataConn.close();

                this.localPeer.destroy();

                this.hostBtn.innerText = 'Host';
                this.collabTag.value = '';
            }
            else if (this.connected) {
                this.connected = false;
                this.hostConn.close();

                this.hostBtn.innerText = 'Host';
                this.collabTag.value = '';
                this.peerList.innerHTML = '';
                document.querySelector('#local-peername').innerHTML = '';
            }
            else
                this.host();
        };
    }

    onUpdate(msgHandler) {
        let onchange = async (e) => {
            if (e.detail.type != 'add')
                return;

            let cmd = e.detail.cmd;
            let isUndo = cmd.isUndo;
            let data = cmd.data;
            switch (cmd.type) {
                case 'add-image': {
                    cmd = {
                        id: cmd.id,
                        type: cmd.type,
                        arrBuff: await cmd.data.blob.arrayBuffer()
                    };
                    break;
                }
                case 'add-card': {
                    cmd = {
                        id: cmd.id,
                        type: isUndo ? cmd.type : 'delete-card',
                        card: isUndo ? cmd.data.card.serialise() : undefined,
                        links: isUndo ? cmd.data.links : undefined
                    };
                    break;
                }
                case 'delete-card': {
                    cmd = {
                        id: cmd.id,
                        type: isUndo ? cmd.type : 'add-card',
                        card: isUndo ? undefined : cmd.data.card.serialise(),
                        links: isUndo ? undefined : cmd.data.links
                    };
                    break;
                }
                case 'card-bounds': {
                    cmd = {
                        id: cmd.id,
                        type: cmd.type,
                        bounds: isUndo ? data.newBounds : data.oldBounds
                    };
                    break;
                }
                case 'card-color': {
                    cmd = {
                        id: cmd.id,
                        type: cmd.type,
                        color: isUndo ? data.newColor : data.oldColor
                    };
                    break;
                }
                case 'add-link': {
                    cmd = {
                        type: isUndo ? 'add-link' : 'delete-link',
                        id: cmd.id
                    };
                    break;
                }
                case 'delete-link': {
                    cmd = {
                        type: isUndo ? 'delete-link' : 'add-link',
                        id: cmd.id
                    };
                    break;
                }
                case 'html-edit': {
                    cmd = {
                        id: cmd.id,
                        type: cmd.type,
                        text: isUndo ? data.text : data.oldText
                    };
                    break;
                }
            }

            msgHandler({
                type: 'edit-update',
                cmd: cmd
            });
        };
        let onCursorPos = () => {
            const pos = window.camera.globalCoords(window.camera.mousePos);
            msgHandler({ type: 'mouse', data: { id: this.localPeer.id, pos: pos } });
        };

        document.addEventListener('mousemove', onCursorPos);
        this.cardsData.undoRedoStack.addEventListener('change', onchange);
    }

    handleEditMsg(data) {
        let cmd = data.cmd;
        switch (cmd.type) {
            case 'add-image': {
                let img = new Blob([cmd.arrBuff]);
                this.cardsData.addImage(cmd.id, img, false);
                break;
            }
            case 'add-card': {
                let card = CardObject.deserialise(cmd.card);
                this.cardsData.restoreCard(cmd.id, card, cmd.links);
                break;
            }
            case 'delete-card': {
                this.cardsData.deleteCard(cmd.id, false);
                break;
            }
            case 'card-bounds': {
                this.cardsData.updateCardBounds(cmd.id, cmd.bounds);
                break;
            }
            case 'card-color': {
                this.cardsData.setCardColor(cmd.id, cmd.color);
                break;
            }
            case 'add-link':
            case 'delete-link': {
                let delim = cmd.id.indexOf('_');
                let start = cmd.id.substring(0, delim);
                let end = cmd.id.substring(delim + 1);

                if (cmd.type.startsWith('add'))
                    this.cardsData.addLink(start, end);
                else
                    this.cardsData.deleteLink(start, end, false);

                break;
            }
            case 'html-edit': {
                // Assume card-{id}
                let id = cmd.id.substring(5);

                let html = DOMPurify.sanitize(cmd.text);
                this.cardsData.get(id).text = html;

                let hide = this.cardsData.undoHandler.get(id).hide;
                hide(() => {
                    let content = getCardContent(id);
                    content.innerHTML = html;

                    for (let img of content.getElementsByClassName('card-image')) {
                        let imageId = null;

                        for (let name of img.classList) {
                            if (name.startsWith('image-')) {
                                imageId = name;
                                break;
                            }
                        }
                        if (imageId != null) {
                            img.src = document.getElementById(imageId).src;
                        }
                    }
                    window.camera.updateLink(id);
                });
                break;
            }
        }
    }

    handleMouse(data) {
        const peerMouseDiv = document.getElementById(`cursor-${data.data.id}`);
        if (peerMouseDiv) {
            peerMouseDiv.style.left = data.data.pos.x + "px";
            peerMouseDiv.style.top = data.data.pos.y + "px";
        }
    }

    addPeerCursor(label, peerId) {
        let color = randomRGBColor();

        const mouseContainer = tag('div', `
        <div class="peer-cursor-label">${label}</div>
        <div class="peer-cursor" style="background-color: ${color}"></div>
    `);
        mouseContainer.id = `cursor-${peerId}`;
        mouseContainer.className = 'cursor-con';

        this.peerCursors.appendChild(mouseContainer);

        return color;
    }

    removePeerCursor(peerId) {
        let cursor = document.getElementById(`cursor-${peerId}`);
        this.peerCursors.removeChild(cursor);
    }

    // peerDesc: {label: peer.label, id: peer.peer}
    addPeer(peerDesc) {
        let color = this.addPeerCursor(peerDesc.label, peerDesc.id);
        let listId = `peer-${peerDesc.id}`;

        let list = tag('li', '');
        list.id = listId;
        list.style.color = color;
        list.innerText = peerDesc.label;
        this.peerList.appendChild(list);
    }

    removePeer(id) {
        this.removePeerCursor(id);

        let t = document.getElementById(`peer-${id}`);
        this.peerList.removeChild(t);
    }

    // Host specific functions
    host() {
        this.localPeer = this.#makePeer();

        this.hosting = true;
        this.hostBtn.innerText = 'Stop Hosting';

        this.localPeer.on('open', () => {
            this.collabTag.value = `https://bayemite.github.io/graph/index.html?hostId=${this.localPeer.id}`;
            this.onUpdate(msg => {
                for (let conn of this.connections.values())
                    conn.send(msg);
            });
        });

        this.localPeer.on('connection', (conn) => this.onNewPeer(conn));
    }

    onPeerData(data, senderId) {
        switch (data.type) {
            case 'edit-update': {
                this.handleEditMsg(data);
                break;
            }
            case 'mouse': {
                this.handleMouse(data);
                break;
            }
        }

        for (let conn of this.connections.values()) {
            if (conn.peer == senderId)
                continue;

            conn.send(data);
        }
    }

    async onNewPeer(newConn) {
        let id = newConn.peer;
        let label = newConn.label;
        let data = { id: id, label: label };

        this.addPeer(data);

        let peers = [{ id: this.localPeer.id, label: 'Host' }];
        for (let conn of this.connections.values()) {
            conn.send({ type: 'new-peer', data: data });
            peers.push({ id: conn.peer, label: conn.label });
        }

        this.connections.set(id, newConn);

        let removeConn = () => {
            for (let conn of this.connections.values())
                conn.send({ type: 'delete-peer', data: data });

            this.connections.delete(id);
            this.removePeer(id);
        };
        newConn.on('disconnected', () => removeConn());
        newConn.on('close', () => removeConn());

        newConn.on('open', async () => {
            newConn.send({
                type: 'init-cards-data',
                data: await this.cardsData.genSave()
            });
            newConn.send({ type: 'new-peers', data: peers });
        });

        newConn.on('data', data => this.onPeerData(data, id));
    }

    // Peer (not-host) specific functions
    onHostOpen() {
        this.connected = true;
        this.hostBtn.innerText = `Disconnect`;

        this.collabTag.value = window.location;

        this.hostConn.on('disconnected', () => {
            this.peerList.removeChild(document.getElementById(`peer-${this.hostId}`));
        });
        this.hostConn.on('close', () => {
            this.peerList.removeChild(document.getElementById(`peer-${this.hostId}`));
        });

        this.onUpdate(msg => this.hostConn.send(msg));

        window.addEventListener('beforeunload', () => this.localPeer.destroy());
        document.querySelector('#local-peername').innerText = `Username: ${this.peerName}`;
    }

    async onHostData(data) {
        let d = data.data;
        switch (data.type) {
            case 'edit-update': {
                this.handleEditMsg(data);
                break;
            }
            case 'mouse': {
                this.handleMouse(data);
                break;
            }
            case 'init-cards-data': {
                this.cardsData.loadSave(d);
                this.cardsData.updateHTML(false);
                await this.localSaver.save();
                break;
            }
            case 'new-peers': {
                for (let desc of d)
                    this.addPeer(desc);
                break;
            }
            case 'new-peer': {
                this.addPeer(d);
                break;
            }
            case 'delete-peer': {
                this.removePeer(d.id);
                break;
            }
        }
    }
}