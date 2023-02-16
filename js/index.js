import * as util from './util.js';
var cardIds = new util.IDAssign();

const backgroundColor = new util.rgb(100, 150, 200);

let zoomTarget = 1.0;
let zoom = 1;

let targetX; // for zoom
let targetY; // for zoom
let mouse;
let cameraPos;

let focusedCard = null;

// File structure
// key is card-'0', corresponds to html id
let cardsData = new Map();
cardsData.set(
    cardIds.getNextId(),
    new util.cardObject(
        0, 0,
        '',
        new Set(),
        'rgb(200, 200, 200)'
    )
);
cardsData.set(
    cardIds.getNextId(),
    new util.cardObject(
        200, 100,
        'Title',
        new Set([0]),
        'rgb(200, 200, 200)'
    )
);

// cardIds.next = Math.max.apply(0, Object.keys(cardsData)) + 1

let cardColours = {};

function closeDialog(e) {
    // console.log(e, e.parentElement)
    e.parentElement.classList.add("dialog-remove");
    setTimeout(function () {
        e.parentElement.remove();
    }, 302);
}

// document.getElementById('dialog-button').onclick = function () { closeDialog(this) }

function addUnlink(start, end) {
    let breakLink = document.createElement('button');
    breakLink.classList.add('connection-button');
    breakLink.id = `unlink-${start}-${end}`;
    breakLink.innerHTML = `
            <span class="material-symbols-outlined">
                delete
            </span>
            `;
    breakLink.onclick = () => deleteLink(start, end);

    breakLink.style.left = `${100}px`;
    document.getElementById('break').appendChild(breakLink);
}
function removeBreakLink(start, end) {
    document.getElementById('break').removeChild(document.getElementById(`unlink-${start}-${end}`));
}

function deleteLink(start, end) {
    cardsData.get(start).connection.delete(end);
    removeBreakLink(start, end);
}

// Add cards from data
function loadCards() {
    for (const [cardId, card] of cardsData) {
        addCard(card.x, card.y, card.title, cardId, card.connection, card.colour);
        if (card.connection.size == 0) { continue; }

        for (let c of card.connection.values())
            addUnlink(cardId, c);
    }
}

// Clears elements for loading new ones
function clearMap() {
    document.getElementById("translate").innerHTML = `
    <div id="break"></div>
    `;
}

let linkStart = -1;
let linkInProgress = false;

// i : id of card (card-'0')
function link(i) {
    linkStart = i;
    linkInProgress = true;
}

// i : id of card
function linkTo(linkEnd) {
    if (!linkInProgress) return;

    if (cardsData.get(linkEnd) === undefined) {
        console.log(linkEnd + " is undefined.");
        console.log(cardsData);
    }
    // Disallow reconnection
    if (cardsData.get(linkEnd).connection.has(linkStart)) {
        linkInProgress = false;
        return;
    }

    // Disallow same connection
    if (cardsData.get(linkStart).connection.has(linkEnd)) {
        linkInProgress = false;
        return;
    }

    // If click on self just ignore
    if (linkStart == linkEnd) return;

    cardsData.get(linkStart).connection.add(linkEnd);
    linkInProgress = false;
    addUnlink(linkStart, linkEnd);
}

function deleteElem(i) {
    if (linkInProgress) return;
    let connections = cardsData.get(i).connection;
    if (connections.size > 0) {
        let unlinkContainer = document.getElementById('break');
        for (let connection of connections.values())
            unlinkContainer.removeChild(document.getElementById(`unlink-${i}-${connection}`));
    }
    // console.log(cardsData)
    for (let [cardId, card] of cardsData) {
        if (card.connection.has(i)) {
            card.connection.delete(i);
            console.log(document.getElementById('break'));
            console.log(`unlink-${cardId}-${i}`);
            document.getElementById('break').removeChild(document.getElementById(`unlink-${cardId}-${i}`));
        }
    }

    cardsData.delete(i);
    cardIds.freeId(i);

    document.getElementById('translate').removeChild(document.getElementById(`card-${i}`));
}

let moveCardI = 0;
let moveFlag = false;
let moveCardOffset = new util.vector2D(0, 0);
function moveElem() {
    let i = moveCardI;
    let card = document.getElementById(`card-${i}`);
    cardsData.get(i).x = Math.floor((mouse.x - cameraPos.x - moveCardOffset.x) / zoom);
    cardsData.get(i).y = Math.floor((mouse.y - cameraPos.y - moveCardOffset.y) / zoom);
    card.style.top = `${cardsData.get(i).y}px`;
    card.style.left = `${cardsData.get(i).x}px`;
}

function genHTMLCard(i, x, y, t) {
    if (t == undefined) { t = ""; };

    let cardContainer = document.createElement('div');

    cardContainer.id = "card-" + i;
    cardContainer.style = "left:" + Math.floor(x) + "px; top:" + Math.floor(y) + "px";
    cardContainer.classList.add('object');
    cardContainer.onclick = () => linkTo(i);

    cardContainer.onmousedown = function (e) {
        moveFlag = true;
        moveCardI = i;

        moveCardOffset.x = mouse.x - e.target.getBoundingClientRect().left;
        moveCardOffset.y = mouse.y - e.target.getBoundingClientRect().top;
    };
    cardContainer.onmousemove = function () {
        if (moveFlag) {
            let card = cardContainer.getElementsByTagName('span')[0];
            card.getElementsByTagName('p')[0].blur();
        }
    };

    cardContainer.appendChild(actualCard());
    cardContainer.appendChild(editUI());

    function actualCard() {
        let card = document.createElement('span');

        let p = document.createElement('p');
        p.classList.add('text', 'card-text');
        p.contentEditable = true;
        p.innerHTML = t;
        p.oninput = () => cardsData.get(i).title = p.innerHTML;

        card.appendChild(p);

        return card;
    }
    function editUI() {
        let actions = document.createElement('div');
        actions.classList.add("actions");
        // no movement
        actions.addEventListener('mousedown', function (e) { e.stopPropagation(); }, true);

        let linkElem = document.createElement('button');
        linkElem.innerHTML = `
        <span class='material-symbols-outlined'>
            share
        </span>
        `;
        linkElem.classList.add("actions-button", "link-button");
        linkElem.onclick = function () { link(i); };
        actions.appendChild(linkElem);

        let deleteDialog = new util.Dialog("Warning", "Are you sure you want to delete this card? This will delete all of its connections.", true, "Cancel", deleteElem, i, "Delete")
        let deleteCard = document.createElement('button');
        deleteCard.innerHTML = `
        <span class="material-symbols-outlined">
            delete
        </span>
        `;
        deleteCard.classList.add("actions-button");
        deleteCard.onclick = function () { deleteDialog.show(); };
        actions.appendChild(deleteCard);

        let clrPicker = document.createElement('div');
        clrPicker.classList.add('color-picker');
        let colorEdit = document.createElement('div');
        let colorInput = document.createElement('input');
        colorInput.onchange = function () {
            // Set colour swatch settings
            cardColours[i] = colorEdit.style.color;
            window.colorSettings(Object.values(cardColours));
        };
        colorInput.type = 'text';
        colorInput.value = 'rgb(200, 200, 200)';
        colorInput.setAttribute('data-coloris', true);
        colorEdit.classList.add('clr-field');
        colorEdit.style.color = 'rgb(200, 200, 200)';
        colorEdit.innerHTML = `
        <button type="button" aria-labelledby="clr-open-label"></button>
        `;
        colorEdit.appendChild(colorInput);
        clrPicker.appendChild(colorEdit);
        // colorEdit.onclick = function() { colorEditElem(i) };
        actions.appendChild(colorEdit);

        // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver

        // Options for the observer (which mutations to observe)
        const config = { attributes: true };

        // Callback function to execute when mutations are observed
        const callback = (mutationList, observer) => {
            for (const mutation of mutationList) {
                if (mutation.attributeName == 'style') {
                    // Set colour variables
                    let color = colorEdit.style.color;
                    cardContainer.style.borderColor = color;
                    cardsData.get(i).colour = color;
                    let components = util.colorValues(color);
                    components[3] = 0.1; // set alpha
                    cardContainer.style.backgroundColor = "rgba(" + components.join(', ') + ")";
                }
            }
        };

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(callback);

        // Start observing the target node for configured mutations
        observer.observe(colorEdit, config);

        // let move = document.createElement('button');
        // move.innerHTML = `
        // <span class="material-symbols-outlined">
        //     open_with
        // </span>
        // `;
        // move.classList.add("actions-button");
        // move.id = 'color-edit-button';

        // move.onmouseup = function () { moveFlag = false };
        // actions.appendChild(move);
        return actions;
    }

    return cardContainer;
    // `
    // <span id="card-${i}" style="..." class="..." onclick="...">
    // <p contenteditable role="textbox" class="text">${t}</p>
    // <button class="link" onclick="link(${i})">Link</button>
    // </span>
    // `;
}

let largest = 0;
function addCard(x, y, t, cardId, connection, colour) {
    util.checkArgs(arguments, 6);
    // Hardcoded solution for now
    // The textbox will always be placed with the default "Enter text" meaning its width will
    // always be the same
    // The width is 136, height is 79

    document.getElementById("translate").appendChild(genHTMLCard(cardId, x - 136 / 2, y - 79 / 2, t));
    let cardContainer = document.getElementById(`card-${cardId}`);
    // Set colour
    cardContainer.style.borderColor = colour;
    let components = util.colorValues(colour);
    components[3] = 0.1;
    cardContainer.style.backgroundColor = "rgba(" + components.join(", ") + ")";
    cardsData.set(cardId, new util.cardObject(x, y, "", connection, colour));

}

// returns id of card
function addDefaultCard() {
    let id = cardIds.getNextId();
    addCard(
        Math.floor((mouse.x - cameraPos.x) / zoom),
        Math.floor((mouse.y - cameraPos.y) / zoom),
        "",
        id,
        new Set(),
        "rgb(200, 200, 200)"
    );
    return id;
}

// Main loop
window.onload = function () {
    // Stub, unused at the moment
    // let peerConnection = new util.PeerConnection();

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    cameraPos = new util.vector2D(canvas.width / 2, canvas.height / 2);
    let mouseDown = false;

    // Mouse delta
    let initX = 0, initY = 0;
    let dragX = 0, dragY = 0;
    let deltaX = 0, deltaY = 0;

    targetX = (canvas.width / 2) / zoom;
    targetY = (canvas.height / 2) / zoom;
    mouse = new util.vector2D(0, 0);

    document.addEventListener('mouseup', function (e) {
        moveFlag = false;
    });

    canvas.addEventListener('dblclick', function (e) {
        e.preventDefault();
        addDefaultCard();
    }, true);
    canvas.addEventListener('mousedown', function (e) {
        if (linkInProgress) {
            if (e.button == 0) {
                let id = addDefaultCard();
                linkTo(id);
            }
            else { linkInProgress = false; }
        } else {
            mouseDown = true;
            initX = e.pageX, initY = e.pageY;
            dragX = e.pageX, dragY = e.pageY;
        }
    });

    document.addEventListener('mousemove', function (e) {
        mouse.x = e.pageX;
        mouse.y = e.pageY;

        // Handle card movement
        // Mouse events are up in card creation
        if (moveFlag) {
            mouse.x = e.pageX;
            mouse.y = e.pageY;
            moveElem();
        }

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

    document.onmouseup = event => mouseDown = false;
    window.onmouseup = event => event.preventDefault();

    document.addEventListener('wheel',
        (event) => {
            event.preventDefault();
            let delta = event.wheelDelta;
            let zoomFactor = 0.0007;
            zoomTarget += delta * zoomFactor;

            let zoomOut = 0.3;
            let zoomIn = 3;
            zoomTarget = util.clamp(zoomOut, zoomTarget, zoomIn);
        }, { passive: false }
    );

    function loadData(parsedData) {
        document.getElementById("title").innerText = parsedData.title;
        parsedData = parsedData.data;
        cardsData.clear();
        let maxId = 0;
        for (let i of Object.keys(parsedData)) {
            maxId = Math.max(i, maxId);
            let iValues = Object.values(parsedData)[i];
            if (!iValues) continue;
            cardsData.set(i,
                new util.cardObject(
                    iValues.x,
                    iValues.y,
                    iValues.title,
                    new Set(Array.from(iValues.connection)),
                    iValues.colour
                )
            );

        }
        cardIds.next = maxId + 1;

        clearMap();
        loadCards();
        console.log(cardsData);
    }

    function copy(that) {
        var inp = document.createElement('input');
        document.body.appendChild(inp)
        inp.value = that.textContent
        inp.select();
        document.execCommand('copy', false);
        inp.remove();
    }

    function newPeerDialog(id) {
        console.log('My peer ID is: ' + id)
        let hostDialog = new util.Dialog("Host ID", `Others can join your session using the following id: <div onclick='copy(this)'>${id}</div>`, false, "Ok")
        hostDialog.show();
    }

    function connectPeerDialog(conn) {
        console.log("Connected: ")
        console.log(conn)
        let hostDialog = new util.Dialog("User Connected", `A user joined your session: ${conn.peer}`, false, "Ok")
        hostDialog.show();
    }

    document.getElementById("host-peer-button").onclick = function () {
        let peerObject = new Peer("Test");
        peerObject.on('open', (id) => newPeerDialog(id));
        peerObject.on('connection', (conn) => {
            connectPeerDialog(conn);

            conn.on('open', () => {
                // console.log(`Connected to host: ${hostId}`);
                // Convert the Map to an array of key-value pairs
                // const dataToSend = Object.fromEntries(cardsData.entries());
                // console.log(dataToSend);

                // const cardsDataArray = Object.fromEntries(cardsData.entries()).map((cardObject) => ({
                //     ...cardObject,
                //     connections: Array.from(cardObject.connections),
                // }));
                const dataToSend = JSON.stringify(genSave())
                console.log(dataToSend);
                // Send the data
                conn.send(dataToSend);

            });

            // Send cardsData to the connected peer
            console.log(cardsData);

            // Listen for incoming data on the dataConnection object
            conn.on('data', (data) => {
                console.log("Received data:", data);
            });
        });
    };


    /*function connectToHost(hostId) {
        const peer = new Peer();

        peer.on('open', (id) => {
            console.log(`Connected with ID: ${id}`);
            const conn = peer.connect(hostId);
            conn.on('open', () => {
                let connectDialog = new util.Dialog("Connected to host", `Successfully connected to host`, false, "Ok")
                connectDialog.show()
                console.log(`Connected to host: ${hostId}`);
            });
        });

        peer.on('error', (error) => {
            console.error(error);
        });
    }*/


    // document.getElementById("connect-button").onclick = () => connectToHost(document.getElementById("peer-id").innerText.trim());

    function connectToHost(hostId) {
        const peer = new Peer();

        let conn;

        peer.on('open', (id) => {
            console.log(`Connected with ID: ${id}`);
            conn = peer.connect(hostId);

            conn.on('open', () => {
                console.log(`Connected to host: ${hostId}`);
            });

            conn.on("data", (data) => {
                console.log(data)
                // Loads cards and resets and sets cardsData
                loadData(tryParseSave(data));
            });
        });


        peer.on('error', (error) => {
            console.error(error);
        });

        const updateNodeText = function (node, text) {
            if (conn) {
                conn.send({ type: 'updateNodeText', nodeId: node.id, text: text });
                console.log('conn')
            }
        };

        return { conn, updateNodeText };
    }

    function observeNodeTextChanges(node, updateNodeText) {
        const observer = new MutationObserver((mutations) => {
            const text = node.innerText.trim();
            updateNodeText(node, text);
            console.log(text);
        });

        observer.observe(node, { characterData: true, subtree: true });
    }

    function attachObserversToExistingNodes(updateNodeText) {
        const nodes = document.querySelectorAll('.card-text');
        nodes.forEach(node => observeNodeTextChanges(node, updateNodeText));
    }

    function attachObserverToNewNodes(updateNodeText) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeName === 'P' && node.classList.includes('card-text')) {
                            observeNodeTextChanges(node, updateNodeText);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }


    document.getElementById("connect-button").onclick = () => {
        const peerId = document.getElementById("peer-id").innerText.trim();
        const { conn, updateNodeText } = connectToHost(peerId);

        // Attach mutation observers to existing and new nodes
        attachObserversToExistingNodes(updateNodeText);
        attachObserverToNewNodes(updateNodeText);
    };




    function tryParseSave(file) {
        let data;
        try {
            data = JSON.parse(file);

        } catch (error) {
            alert("Could not load file");
            console.log("File incompatible");
            return;
        }
        return data;
    }

    const fileInput = document.getElementById('openFile');
    fileInput.onchange = async function () {
        // let selectedFile = fileInput.files[0];
        let file = new FileReader();
        file.onload = () => {
            let fileData = tryParseSave(file.result);
            loadData(fileData);
        };
        file.readAsText(this.files[0]);
        fileInput.value = '';
    };

    let localSave = window.localStorage.getItem('localSave');
    if (localSave)
        loadData(tryParseSave(localSave));
    else
        loadCards();


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

    function genSave() {
        let saveData = {
            title: document.getElementById("title").innerText,
            data: {}
        };
        for (let [cardId, card] of cardsData) {
            saveData.data[cardId] = {
                "x": card.x,
                "y": card.y,
                "title": card.title,
                "connection": Array.from(card.connection),
                // "id": card.id,
                "colour": card.colour,
            };
        }
        return saveData;
    };
    document.getElementById('save').onclick = () => {
        let saveData = genSave();
        download(JSON.stringify(saveData), saveData.title, "application/json");
    };
    window.onbeforeunload = (e) => {
        window.localStorage.setItem('localSave', JSON.stringify(genSave())); console.log("saved");
    };

    function cameraMovement() {
        let prevZoom = zoom;
        zoom = util.lerp(zoom, zoomTarget, 0.3);
        let deltaZoom = zoom - prevZoom;

        let offsetZoomX = deltaZoom * (window.innerWidth / 2 - mouse.x);
        let offsetZoomY = deltaZoom * (window.innerHeight / 2 - mouse.y);
        targetX += offsetZoomX;
        targetY += offsetZoomY;

        let translateLerpScale = 0.9;
        cameraPos.x = util.lerp(cameraPos.x, targetX, translateLerpScale);
        cameraPos.y = util.lerp(cameraPos.y, targetY, translateLerpScale);

        let transformNode = document.getElementById('translate');
        transformNode.style.transform = `translate(${cameraPos.x}px, ${cameraPos.y}px) scale(${zoom})`;
    };

    function main(currentTime) {
        window.requestAnimationFrame(main);
        cameraMovement();

        // Clear canvas
        ctx.fillStyle = "#fff";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // ctx.fillRect((mouse.x + cameraPos.x) - canvas.width / 2 - 25, (mouse.y - cameraPos.y) + canvas.height / 2 - 25, 50, 50)

        // Constants
        let curveWidth = Math.floor(50 * zoom);
        let limiter = 5; // Limiter before the line connection direction changes

        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "rgba(200, 200, 200, 1)";
        ctx.lineWidth = 2 * zoom;

        // Connection lines

        // xr += 4 * Math.tan(-(-mouse.x - x2) / (-mouse.y - y2)) * (triRad * 2 * zoom)
        let number = 5;
        let triRad = 4;

        if (linkInProgress) {
            // Get element connecting to other mouse
            // console.log(linkStart)
            let elem = document.getElementById(`card-${linkStart}`);
            let x2 = Math.floor(-elem.style.left.replace('px', '') * zoom - cameraPos.x);
            let y2 = Math.floor(-elem.style.top.replace('px', '') * zoom - cameraPos.y);

            // Get other element
            // let root = document.getElementById(`card-${data[i].connection}`)
            // console.log(Math.tan(-(-mouse.x - x2) / (-mouse.y - y2)))
            let xr = -mouse.x;
            let yr = -mouse.y - triRad * 2 * zoom;
            if (x2 < xr) {
                curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (xr + elem.offsetWidth - x2) / zoom / 500, 1);
                ctx.moveTo(-xr + (number * zoom) - 2, -yr - (number / 2) * zoom);
                ctx.bezierCurveTo(
                    -xr + (number * zoom) + curveWidth, -yr + (number / 2) * zoom,
                    -x2 - curveWidth, -y2 + (elem.offsetHeight / 2) * zoom,
                    -x2 + 1,
                    -y2 + (elem.offsetHeight / 2) * zoom
                );
                ctx.stroke();
                new util.drawTriangle(ctx, -xr + (number * zoom) - 2 + (triRad + 0.5) * zoom, -yr - (number / 2) * zoom, triRad, zoom, '#fff', -90);
            } else if (-xr + (number) + (curveWidth * zoom / limiter) > -x2 - (curveWidth * zoom / limiter) && (-xr + (curveWidth * zoom / limiter) < -x2 + (elem.offsetWidth * zoom) + (curveWidth * zoom / limiter))) {
                if (yr > y2) {
                    curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (yr - y2) / zoom / 500, 1);
                    ctx.moveTo(-xr + (number / 2 * zoom) - 1, -yr + (number) * zoom - 1);
                    ctx.bezierCurveTo(-xr + (number / 2 * zoom), -yr + (number) * zoom + curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 - curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + 1);
                    ctx.stroke();
                    new util.drawTriangle(ctx, -xr + (number / 2 * zoom) - 1, -yr + (number) * zoom - 1 + (triRad + 0.5) * zoom, triRad, zoom, '#fff', 0);
                } else {
                    curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (y2 - yr) / zoom / 500, 1);
                    ctx.moveTo(-xr + (number / 2 * zoom) - 1, -yr + 1);
                    ctx.bezierCurveTo(-xr + (number / 2 * zoom), -yr - curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + (elem.offsetHeight * zoom) + curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + (elem.offsetHeight * zoom) - 1);
                    ctx.stroke();
                    new util.drawTriangle(ctx, -xr + (number / 2 * zoom) - 1, -yr + 1 - (triRad + 0.5) * zoom, triRad, zoom, '#fff', 180);
                }
            } else {
                curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (x2 - xr) / zoom / 500, 1);
                ctx.moveTo(-xr + 1, -yr + (number / 2) * zoom);
                ctx.bezierCurveTo(-xr - curveWidth, -yr + (number / 2) * zoom,
                    -x2 + (elem.offsetWidth * zoom) + curveWidth, -y2 + (elem.offsetHeight / 2) * zoom,
                    -x2 + (elem.offsetWidth * zoom) - 1, -y2 + (elem.offsetHeight / 2) * zoom);
                ctx.stroke();
                new util.drawTriangle(ctx, -xr + 1 - (triRad + 0.5) * zoom, -yr + (number / 2) * zoom, triRad, zoom, '#fff', 90);
            }
            ctx.closePath();
            // console.log(-(xr - x2), (yr - y2))
            // console.log(Math.atan2(-(xr - x2), (yr - y2)) * 180 / Math.PI)
            // new util.drawTriangle(ctx, -xr + (number * zoom) - 2 + (triRad + 0.5) * zoom, -yr + (number / 2) * zoom, triRad, zoom, '#fff', Math.atan2(-(xr - x2), (yr - y2)) * 180 / Math.PI)
            // new util.drawTriangle(ctx, -xr + (triRad + 0.5) * zoom, -yr + + (triRad + 0.5) * zoom, triRad, zoom, '#fff', Math.atan2(-(xr - x2), (yr - y2)) * 180 / Math.PI)
        }

        for (let [cardId, card] of cardsData) {
            if (card.connection.size == 0)
                continue;

            curveWidth = Math.floor(50 * zoom); // Set default

            // Get element connecting to other element
            let elem = document.getElementById(`card-${cardId}`);
            if (elem == null) {
                console.log(`card-${cardId} is null`);
                continue;
            }
            let x2 = Math.floor(-elem.style.left.replace('px', '') * zoom - cameraPos.x);
            let y2 = Math.floor(-elem.style.top.replace('px', '') * zoom - cameraPos.y);

            // Get other element
            for (let connection of card.connection.values()) {
                let root = document.getElementById(`card-${connection}`);
                if (root == null) {
                    console.log(`card-${connection} is null`);
                    continue;
                }
                let xr = Math.floor(-root.style.left.replace('px', '') * zoom - cameraPos.x);
                let yr = Math.floor(-root.style.top.replace('px', '') * zoom - cameraPos.y);

                let unlink = document.getElementById(`unlink-${cardId}-${connection}`);
                if (unlink == null) {
                    console.log(`unlink-${cardId}-${connection} is null`);
                    continue;
                }

                // Styling
                // Wait where did it go lol

                // These are like
                // Stuff that like
                // Works and like
                // yeah
                // massive L
                ctx.beginPath();
                if (-xr + (root.offsetWidth * zoom) < -x2) {
                    curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (xr - x2) / zoom / 500, 1);
                    ctx.moveTo(-xr + (root.offsetWidth * zoom) - 2, -yr + (root.offsetHeight / 2) * zoom);
                    ctx.bezierCurveTo(-xr + (root.offsetWidth * zoom) + curveWidth, -yr + (root.offsetHeight / 2) * zoom,
                        -x2 - curveWidth, -y2 + (elem.offsetHeight / 2) * zoom,
                        -x2 + 1, -y2 + (elem.offsetHeight / 2) * zoom);
                    ctx.stroke();
                    new util.drawTriangle(ctx, -xr + (root.offsetWidth * zoom) - 2 + (triRad + 0.5) * zoom, -yr + (root.offsetHeight / 2) * zoom, triRad, zoom, '#fff', -90);
                    unlink.style.left = `${((Math.floor(elem.style.left.replace('px', '')) + (Math.floor(root.style.left.replace('px', '')) + root.offsetWidth)) / 2) - unlink.offsetWidth / 2}px`;
                    unlink.style.top = `${((Math.floor(elem.style.top.replace('px', '')) + (Math.floor(root.style.top.replace('px', '')) + root.offsetHeight)) / 2) - unlink.offsetHeight / 2}px`;
                } else if (-xr + (root.offsetWidth * zoom) + (curveWidth * zoom / limiter) > -x2 - (curveWidth * zoom / limiter) && (-xr + (curveWidth * zoom / limiter) < -x2 + (elem.offsetWidth * zoom) + (curveWidth * zoom / limiter))) {
                    if (yr > y2) {
                        curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (yr - y2) / zoom / 500, 1);
                        ctx.moveTo(-xr + (root.offsetWidth / 2 * zoom) - 1, -yr + (root.offsetHeight) * zoom - 1);
                        ctx.bezierCurveTo(-xr + (root.offsetWidth / 2 * zoom), -yr + (root.offsetHeight) * zoom + curveWidth,
                            -x2 + (elem.offsetWidth / 2 * zoom), -y2 - curveWidth,
                            -x2 + (elem.offsetWidth / 2 * zoom), -y2 + 1);
                        ctx.stroke();
                        new util.drawTriangle(ctx, -xr + (root.offsetWidth / 2 * zoom) - 1, -yr + (root.offsetHeight) * zoom - 1 + (triRad + 0.5) * zoom, triRad, zoom, '#fff', 0);
                        unlink.style.left = `${(((Math.floor(elem.style.left.replace('px', '')) + elem.offsetWidth / 2)) + (Math.floor(root.style.left.replace('px', '')) + root.offsetWidth / 2)) / 2 - unlink.offsetWidth / 2}px`;
                        unlink.style.top = `${(((Math.floor(elem.style.top.replace('px', '')) + elem.offsetHeight) + (Math.floor(root.style.top.replace('px', '')))) / 2) - unlink.offsetHeight / 2}px`;

                    } else {
                        curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (y2 - yr) / zoom / 500, 1);
                        ctx.moveTo(-xr + (root.offsetWidth / 2 * zoom) - 1, -yr + 1);
                        ctx.bezierCurveTo(-xr + (root.offsetWidth / 2 * zoom), -yr - curveWidth,
                            -x2 + (elem.offsetWidth / 2 * zoom), -y2 + (elem.offsetHeight * zoom) + curveWidth,
                            -x2 + (elem.offsetWidth / 2 * zoom), -y2 + (elem.offsetHeight * zoom) - 1);
                        ctx.stroke();
                        new util.drawTriangle(ctx, -xr + (root.offsetWidth / 2 * zoom) - 1, -yr + 1 - (triRad + 0.5) * zoom, triRad, zoom, '#fff', 180);
                        unlink.style.left = `${(((Math.floor(elem.style.left.replace('px', '')) + elem.offsetWidth / 2)) + (Math.floor(root.style.left.replace('px', '')) + root.offsetWidth / 2)) / 2 - unlink.offsetWidth / 2}px`;
                        unlink.style.top = `${((Math.floor(elem.style.top.replace('px', '')) + (Math.floor(root.style.top.replace('px', '')) + root.offsetHeight)) / 2) - unlink.offsetHeight / 2}px`;

                    }
                } else {
                    curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (x2 - xr) / zoom / 500, 1);
                    ctx.moveTo(-xr + 1, -yr + (root.offsetHeight / 2) * zoom);
                    ctx.bezierCurveTo(-xr - curveWidth, -yr + (root.offsetHeight / 2) * zoom,
                        -x2 + (elem.offsetWidth * zoom) + curveWidth, -y2 + (elem.offsetHeight / 2) * zoom,
                        -x2 + (elem.offsetWidth * zoom) - 1, -y2 + (elem.offsetHeight / 2) * zoom);
                    ctx.stroke();
                    new util.drawTriangle(ctx, -xr + 1 - (triRad + 0.5) * zoom, -yr + (root.offsetHeight / 2) * zoom, triRad, zoom, '#fff', 90);
                    unlink.style.left = `${(((Math.floor(elem.style.left.replace('px', '')) + elem.offsetWidth) + (Math.floor(root.style.left.replace('px', '')))) / 2) - unlink.offsetWidth / 2}px`;
                    unlink.style.top = `${((Math.floor(elem.style.top.replace('px', '')) + (Math.floor(root.style.top.replace('px', '')) + root.offsetHeight)) / 2) - unlink.offsetHeight / 2}px`;

                }
            }
        }
    }

    main(); // Start the cycle
};