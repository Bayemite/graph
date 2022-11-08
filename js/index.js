import * as util from './util.js';

var peer = new Peer();
var cardIds = new util.IDAssign();

peer.on('open', function (id) {
    console.log('My peer ID is: ' + id);
});

peer.on('connection', function (conn) {
    console.log(conn)
});

function connect(id) {
    console.log(id)
    var conn = peer.connect(id);
}
const connectionButton = document.getElementById('connect-button')
connectionButton.onclick = function () { connect(document.getElementById('peer-id').innerHTML) }

const backgroundColor = new util.rgb(100, 150, 200);

let canvas = null;
let ctx = null;

let zoomScale = 0.001;
let zoomTarget = 1.0;
let zoom = 1;

let targetX; // for zoom
let targetY; // for zoom
let mouse;
let cameraPos;

let focusedCard = null;

// RGB class in functions.js
let colorPalette = [
    new util.rgb(51, 153, 255),
    new util.rgb(0, 100, 210),
    new util.rgb(115, 230, 20),
    new util.rgb(0, 204, 136),
    new util.rgb(255, 170, 20),
]

// File structure
// key is card-'0', corresponds to html id
let cardsData = {
    '0': new util.cardObject(
        0, 0,
        '', null, 'rgb(200, 200, 200)'
    ),
    '1': new util.cardObject(
        200, 100,
        'Title', 0, 'rgb(200, 200, 200)'
    ),
    // new util.cardObject(
    //     -200, 100,
    //     'Title', 0, 2
    // ),
}
cardIds.next = Math.max.apply(0, Object.keys(cardsData)) + 1
console.log(cardIds)

function closeNotif(e) {
    // console.log(e, e.parentElement)
    e.parentElement.classList.add("notification-remove")
    setTimeout(function () {
        e.parentElement.remove()
    }, 302)
}

// document.getElementById('notif-button').onclick = function() {closeNotif(this)}

// Add cards from data
function loadCards() {
    for (let cardId of Object.keys(cardsData)) {
        let card = Object.values(cardsData)[cardId]
        addCard(card.x, card.y, card.title, true, cardId, card.connection);
        // console.log(data[i].connection);
        // if (data[i].connection == null) { continue }
        let breakLink = document.createElement('button');
        breakLink.classList.add('connection-button')
        breakLink.id = `unlink-${cardId}`;
        breakLink.innerHTML = `
        <span class="material-symbols-outlined">
            delete
        </span>
        `
        // breakLink.onclick = `
        // unlink(${i})
        // `
        breakLink.style.left = `${300}px`;
        // console.log(breakLink);
        document.getElementById('break').appendChild(breakLink);
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
function linkTo(i) {
    if (!linkInProgress) return;

    // Disallow reconnection
    if (cardsData[i].connection == linkStart) {
        linkInProgress = false;
        return;
    }

    let linkEnd = i;

    // If click on self just ignore
    if (linkStart == linkEnd) return;

    cardsData[linkStart].connection = linkEnd;
    console.log(cardsData[linkStart].connection);
    linkInProgress = false;
}

function deleteElem(i) {
    for (let k in Object.keys(cardsData)) {
        if (cardsData[k].connection == i) {
            cardsData[k].connection = null;
        }
    }

    delete cardsData[i];
    cardIds.freeId(i);

    document.getElementById('translate').removeChild(document.getElementById(`card-${i}`));
}

let moveCardI = 0;
let moveFlag = false;
let moveCardOffset = new util.vector2D(0, 0);
function moveElem() {
    let i = moveCardI;
    let card = document.getElementById(`card-${i}`);
    cardsData[i].x = Math.floor((mouse.x - cameraPos.x - moveCardOffset.x) / zoom);
    cardsData[i].y = Math.floor((mouse.y - cameraPos.y - moveCardOffset.y) / zoom);
    card.style.top = `${cardsData[i].y}px`;
    card.style.left = `${cardsData[i].x}px`;
}

function newCard(i, x, y, t, c) {
    if (t == undefined) { t = "" };

    cardsData[i] = new util.cardObject();
    cardsData[i].title = t;
    cardsData[i].x = x;
    cardsData[i].y = y;
    cardsData[i].connection = c;
    cardsData[i].id = i;
    cardsData[i].colour = 0;

    let cardContainer = document.createElement('div');

    cardContainer.id = "card-" + i;
    cardContainer.style = "left:" + Math.floor(x) + "px; top:" + Math.floor(y) + "px";
    cardContainer.classList.add('object');
    cardContainer.onclick = function () { linkTo(i) };

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
    }

    cardContainer.appendChild(actualCard());
    cardContainer.appendChild(editUI());

    function actualCard() {
        let card = document.createElement('span');

        let p = document.createElement('p');
        p.classList.add('text');
        p.contentEditable = true;
        p.innerHTML = t;
        p.oninput = () => cardsData[i.toString()].title = p.innerHTML;

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
        linkElem.onclick = function () { link(i) };
        actions.appendChild(linkElem);

        let deleteCard = document.createElement('button');
        deleteCard.innerHTML = `
        <span class="material-symbols-outlined">
            delete
        </span>
        `;
        deleteCard.classList.add("actions-button", "color-edit-button");
        deleteCard.onclick = function () { deleteElem(i) };
        actions.appendChild(deleteCard);

        let clrPicker = document.createElement('div')
        clrPicker.classList.add('color-picker')
        let colorEdit = document.createElement('div');
        let colorInput = document.createElement('input');
        colorInput.type = 'text'
        colorInput.value = 'rgb(200, 200, 200)'
        colorInput.setAttribute('data-coloris', true)
        colorEdit.classList.add('clr-field')
        colorEdit.style.color = 'rgb(200, 200, 200)'
        colorEdit.innerHTML = `
        <button type="button" aria-labelledby="clr-open-label"></button>
        `;
        colorEdit.appendChild(colorInput);
        clrPicker.appendChild(colorEdit)
        // colorEdit.onclick = function() { colorEditElem(i) };
        actions.appendChild(colorEdit);

        // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver

        // Options for the observer (which mutations to observe)
        const config = { attributes: true };

        // Callback function to execute when mutations are observed
        const callback = (mutationList, observer) => {
            for (const mutation of mutationList) {
                if (mutation.attributeName == 'style') {
                    cardContainer.style.borderColor = colorEdit.style.color
                    Object.values(cardsData)[Object.keys(cardsData)[i]].colour = colorEdit.style.color
                    console.log(cardsData)
                    if (colorEdit.style.color.split(',')[3] !== undefined) {
                        let temp = colorEdit.style.color.split(',')
                        temp[3] = (parseFloat(temp[3].replace(')', ""))/10).toString() + ')'
                        cardContainer.style.backgroundColor = temp
                    } else {
                        let temp = colorEdit.style.color
                        temp = temp.replace('rgb', 'rgba')
                        temp = temp.replace(')', ', 0.1)')
                        cardContainer.style.backgroundColor = temp
                    }
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


let add = false; // Add card
let largest = 0;
function addCard(x, y, t, newInstance, i, c) {
    // Hardcoded solution for now
    // The textbox will always be placed with the default "Enter text" meaning its width will
    // always be the same
    // The width is 136, height is 79

    if (newInstance) {
        document.getElementById("translate").appendChild(newCard(i, x - 136 / 2, y - 79 / 2, t, c));
    } else {
        document.getElementById("translate").appendChild(newCard(i, x - 136 / 2, y - 79 / 2, t));
        cardsData[i] = new util.cardObject(x, y, "", null, i);
        // cardsData[`${Number(largest) + 1}`] = "a"
        console.log(cardsData);
        // cardsData.push()
    }
    // data.push(
    //     {
    //         title: t,
    //         x: x,
    //         y: y,
    //         connection: null,
    //         colour: 0,
    //         id: largest + 1,
    //     }
    // )
    // card = document.getElementById(`card-${i}`)

}


// Main loop
window.onload = function () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    function resize() {
        // Resize the canvas to the screen
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // ctx.fillStyle = backgroundColor; // Background colour
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    document.getElementById("add").onclick = function () {
        add = !add;
        if (add) {
            document.getElementById('add').classList.add('selected')
        } else {
            document.getElementById('add').classList.remove('selected')
        }

    }
    resize();

    cameraPos = new util.vector2D(canvas.width / 2, canvas.height / 2);
    let mouseDown = false;

    // Mouse delta
    let initX = 0, initY = 0;
    let dragX = 0, dragY = 0;
    let deltaX = 0, deltaY = 0;
    let finalX = 0, finalY = 0;

    targetX = (canvas.width / 2) / zoom;
    targetY = (canvas.height / 2) / zoom;
    mouse = new util.vector2D(0, 0);

    document.addEventListener('mouseup', function (e) {
        moveFlag = false;
    })

    canvas.addEventListener('dblclick', function (e) {
        e.preventDefault();
        addCard(
            Math.floor((mouse.x - cameraPos.x) / zoom),
            Math.floor((mouse.y - cameraPos.y) / zoom),
            "",
            true,
            cardIds.getNextId(),
            null
        );
    }, true);
    document.addEventListener('contextmenu', function (e) {
        // e.preventDefault();
    })
    canvas.addEventListener('mousedown', function (e) {
        if (add) {
            addCard(
                Math.floor((mouse.x - cameraPos.x) / zoom),
                Math.floor((mouse.y - cameraPos.y) / zoom),
                "",
                cardIds.getNextId(),
                null
            );

            document.getElementById('add').classList.remove('selected');
            add = false;
        } else if (linkInProgress) {
            linkInProgress = false;
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

    document.addEventListener('mouseup', function () {
        mouseDown = false;
    });
    window.onmouseup = event => event.preventDefault();

    window.addEventListener('mousewheel', function (evt) {
        let delta = evt.wheelDelta;
        let zoomFactor = 0.0007;
        zoomTarget += delta * zoomFactor;

        let zoomOut = 0.3;
        let zoomIn = 3;
        zoomTarget = util.clamp(zoomOut, zoomTarget, zoomIn);
    });

    loadCards();

    const fileInput = document.getElementById('openFile');
    fileInput.onchange = async function () {
        // let selectedFile = fileInput.files[0];
        let file = new FileReader();
        file.onload = () => {
            let fileData;
            try {
                fileData = JSON.parse(file.result)
                document.getElementById("title").innerText = fileData.title
                fileData = fileData.data
            } catch (error) {
                alert("File format incompatible")
                console.log("File incompatible")
                return
            }
            cardsData = {};
            for (let i of Object.keys(fileData)) {
                let iValues = Object.values(fileData)
                cardsData[i] = (new util.cardObject(
                    iValues.x,
                    iValues.y,
                    iValues.title,
                    iValues.connection,
                    iValues.color
                )
                )

            }
            clearMap();
            loadCards();
            console.log(cardsData);

        }
        file.readAsText(this.files[0]);
        fileInput.value = ''
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

    document.getElementById('save').onclick = function () {
        let saveData = {
            title: document.getElementById("title").innerText,
            data: []
        }
        for (let card of Object.values(cardsData)) {
            saveData.data.push(
                {
                    "x": card.x,
                    "y": card.y,
                    "title": card.title,
                    "connection": card.connection,
                    // "id": card.id,
                    "colour": card.colour,
                }
            )
        }
        download(JSON.stringify(saveData), saveData.title, "application/json")
    }

    function main(currentTime) {
        window.requestAnimationFrame(main);
        document.getElementById('break').innerHTML = ""

        let translateLerpScale = 0.9;

        zoom = util.lerp(zoom, zoomTarget, 0.3);
        cameraPos.x = util.lerp(cameraPos.x, targetX, translateLerpScale);
        cameraPos.y = util.lerp(cameraPos.y, targetY, translateLerpScale);
        ctx.fillStyle = "#fff"
        document.getElementById('translate').style.transform = `translate(${cameraPos.x}px, ${cameraPos.y}px) scale(${zoom})`;

        // Template get position of cursor in "map space"
        // document.getElementById(`card-0`).style.left = `${(mouse.x - cameraPos.x) / zoom}px`
        // document.getElementById(`card-0`).style.top = `${(mouse.y - cameraPos.y) / zoom}px`

        // Zoom needs fixing, needs to be anchored in the middle of the screen not 0, 0
        // ctx.fillStyle = backgroundColor; // Background colour
        // ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // ctx.fillRect((mouse.x + cameraPos.x) - canvas.width / 2 - 25, (mouse.y - cameraPos.y) + canvas.height / 2 - 25, 50, 50)

        // Constants
        let curveWidth = Math.floor(50 * zoom)
        let limiter = 5; // Limiter before the line connection direction changes

        ctx.fillStyle = "#fff"
        ctx.strokeStyle = "rgba(200, 200, 200, 1)"
        ctx.lineWidth = 2 * zoom

        // Connection lines

        // xr += 4 * Math.tan(-(-mouse.x - x2) / (-mouse.y - y2)) * (triRad * 2 * zoom)
        let number = 5;
        let triRad = 4

        if (linkInProgress) {
            // Get element connecting to other mouse
            // console.log(linkStart)
            let elem = document.getElementById(`card-${linkStart}`)
            let x2 = Math.floor(-elem.style.left.replace('px', '') * zoom - cameraPos.x)
            let y2 = Math.floor(-elem.style.top.replace('px', '') * zoom - cameraPos.y)

            // Get other element
            // let root = document.getElementById(`card-${data[i].connection}`)
            // console.log(Math.tan(-(-mouse.x - x2) / (-mouse.y - y2)))
            let xr = -mouse.x
            let yr = -mouse.y - triRad * 2 * zoom
            if (x2 < xr) {
                curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (xr + elem.offsetWidth - x2) / zoom / 500, 1)
                ctx.moveTo(-xr + (number * zoom) - 2, -yr - (number / 2) * zoom);
                ctx.bezierCurveTo(-xr + (number * zoom) + curveWidth, -yr + (number / 2) * zoom,
                    -x2 - curveWidth, -y2 + (elem.offsetHeight / 2) * zoom,
                    -x2 + 1, -y2 + (elem.offsetHeight / 2) * zoom);
                ctx.stroke();
                new util.drawTriangle(ctx, -xr + (number * zoom) - 2 + (triRad + 0.5) * zoom, -yr - (number / 2) * zoom, triRad, zoom, '#fff', -90)
            } else if (-xr + (number) + (curveWidth * zoom / limiter) > -x2 - (curveWidth * zoom / limiter) && (-xr + (curveWidth * zoom / limiter) < -x2 + (elem.offsetWidth * zoom) + (curveWidth * zoom / limiter))) {
                if (yr > y2) {
                    curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (yr - y2) / zoom / 500, 1)
                    ctx.moveTo(-xr + (number / 2 * zoom) - 1, -yr + (number) * zoom - 1);
                    ctx.bezierCurveTo(-xr + (number / 2 * zoom), -yr + (number) * zoom + curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 - curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + 1);
                    ctx.stroke();
                    new util.drawTriangle(ctx, -xr + (number / 2 * zoom) - 1, -yr + (number) * zoom - 1 + (triRad + 0.5) * zoom, triRad, zoom, '#fff', 0)
                } else {
                    curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (y2 - yr) / zoom / 500, 1)
                    ctx.moveTo(-xr + (number / 2 * zoom) - 1, -yr + 1);
                    ctx.bezierCurveTo(-xr + (number / 2 * zoom), -yr - curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + (elem.offsetHeight * zoom) + curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + (elem.offsetHeight * zoom) - 1);
                    ctx.stroke();
                    new util.drawTriangle(ctx, -xr + (number / 2 * zoom) - 1, -yr + 1 - (triRad + 0.5) * zoom, triRad, zoom, '#fff', 180)
                }
            } else {
                curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (x2 - xr) / zoom / 500, 1)
                ctx.moveTo(-xr + 1, -yr + (number / 2) * zoom);
                ctx.bezierCurveTo(-xr - curveWidth, -yr + (number / 2) * zoom,
                    -x2 + (elem.offsetWidth * zoom) + curveWidth, -y2 + (elem.offsetHeight / 2) * zoom,
                    -x2 + (elem.offsetWidth * zoom) - 1, -y2 + (elem.offsetHeight / 2) * zoom);
                ctx.stroke();
                new util.drawTriangle(ctx, -xr + 1 - (triRad + 0.5) * zoom, -yr + (number / 2) * zoom, triRad, zoom, '#fff', 90)
            }
            ctx.closePath();
            // console.log(-(xr - x2), (yr - y2))
            // console.log(Math.atan2(-(xr - x2), (yr - y2)) * 180 / Math.PI)
            // new util.drawTriangle(ctx, -xr + (number * zoom) - 2 + (triRad + 0.5) * zoom, -yr + (number / 2) * zoom, triRad, zoom, '#fff', Math.atan2(-(xr - x2), (yr - y2)) * 180 / Math.PI)
            // new util.drawTriangle(ctx, -xr + (triRad + 0.5) * zoom, -yr + + (triRad + 0.5) * zoom, triRad, zoom, '#fff', Math.atan2(-(xr - x2), (yr - y2)) * 180 / Math.PI)
        }


        for (let cardId of Object.keys(cardsData)) {
            let card = Object.values(cardsData)[cardId]
            if (card.connection == null)
                continue;

            curveWidth = Math.floor(50 * zoom) // Set default

            // Get element connecting to other element
            let elem = document.getElementById(`card-${cardId}`);
            let x2 = Math.floor(-elem.style.left.replace('px', '') * zoom - cameraPos.x);
            let y2 = Math.floor(-elem.style.top.replace('px', '') * zoom - cameraPos.y);

            // Get other element
            let root = document.getElementById(`card-${card.connection}`);
            let xr = Math.floor(-root.style.left.replace('px', '') * zoom - cameraPos.x);
            let yr = Math.floor(-root.style.top.replace('px', '') * zoom - cameraPos.y);



            // Styling
            // Wait where did it go lol

            // These are like
            // Stuff that like
            // Works and like
            // yeah
            ctx.beginPath();
            if (-xr + (root.offsetWidth * zoom) < -x2) {
                curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (xr - x2) / zoom / 500, 1)
                ctx.moveTo(-xr + (root.offsetWidth * zoom) - 2, -yr + (root.offsetHeight / 2) * zoom);
                ctx.bezierCurveTo(-xr + (root.offsetWidth * zoom) + curveWidth, -yr + (root.offsetHeight / 2) * zoom,
                    -x2 - curveWidth, -y2 + (elem.offsetHeight / 2) * zoom,
                    -x2 + 1, -y2 + (elem.offsetHeight / 2) * zoom);
                ctx.stroke();
                new util.drawTriangle(ctx, -xr + (root.offsetWidth * zoom) - 2 + (triRad + 0.5) * zoom, -yr + (root.offsetHeight / 2) * zoom, triRad, zoom, '#fff', -90)
            } else if (-xr + (root.offsetWidth * zoom) + (curveWidth * zoom / limiter) > -x2 - (curveWidth * zoom / limiter) && (-xr + (curveWidth * zoom / limiter) < -x2 + (elem.offsetWidth * zoom) + (curveWidth * zoom / limiter))) {
                if (yr > y2) {
                    curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (yr - y2) / zoom / 500, 1)
                    ctx.moveTo(-xr + (root.offsetWidth / 2 * zoom) - 1, -yr + (root.offsetHeight) * zoom - 1);
                    ctx.bezierCurveTo(-xr + (root.offsetWidth / 2 * zoom), -yr + (root.offsetHeight) * zoom + curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 - curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + 1);
                    ctx.stroke();
                    new util.drawTriangle(ctx, -xr + (root.offsetWidth / 2 * zoom) - 1, -yr + (root.offsetHeight) * zoom - 1 + (triRad + 0.5) * zoom, triRad, zoom, '#fff', 0)
                } else {
                    curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (y2 - yr) / zoom / 500, 1)
                    ctx.moveTo(-xr + (root.offsetWidth / 2 * zoom) - 1, -yr + 1);
                    ctx.bezierCurveTo(-xr + (root.offsetWidth / 2 * zoom), -yr - curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + (elem.offsetHeight * zoom) + curveWidth,
                        -x2 + (elem.offsetWidth / 2 * zoom), -y2 + (elem.offsetHeight * zoom) - 1);
                    ctx.stroke();
                    new util.drawTriangle(ctx, -xr + (root.offsetWidth / 2 * zoom) - 1, -yr + 1 - (triRad + 0.5) * zoom, triRad, zoom, '#fff', 180)
                }
            } else {
                curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (x2 - xr) / zoom / 500, 1)
                ctx.moveTo(-xr + 1, -yr + (root.offsetHeight / 2) * zoom);
                ctx.bezierCurveTo(-xr - curveWidth, -yr + (root.offsetHeight / 2) * zoom,
                    -x2 + (elem.offsetWidth * zoom) + curveWidth, -y2 + (elem.offsetHeight / 2) * zoom,
                    -x2 + (elem.offsetWidth * zoom) - 1, -y2 + (elem.offsetHeight / 2) * zoom);
                ctx.stroke();
                new util.drawTriangle(ctx, -xr + 1 - (triRad + 0.5) * zoom, -yr + (root.offsetHeight / 2) * zoom, triRad, zoom, '#fff', 90)
            }
        }
    }

    main(); // Start the cycle
};