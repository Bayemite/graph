import * as util from './util.js';

const backgroundColor = new util.rgb(100, 150, 200);

let canvas = null;
let ctx = null;

let zoomScale = 0.001;
let zoomTarget = 1.0;
let zoom = 1;

let targetX;
let targetY;
let mouse;
let cameraPos;

// RGB class in functions.js
let colorPalette = [
    new util.rgb(51, 153, 255),
    new util.rgb(0, 100, 210),
    new util.rgb(115, 230, 20),
    new util.rgb(0, 204, 136),
    new util.rgb(255, 170, 20),
]

// File structure
let data = [
    new util.cardObject(
        0, 0,
        '', null, 0
    ),
    // new util.cardObject(
    //     200, 100,
    //     'Title', 0, 1
    // ),
    // new util.cardObject(
    //     -200, 100,
    //     'Title', 0, 2
    // ),
]

// Add cards from data
function loadCards() {
    for (let i = 0; i < data.length; i++) {
        addCard(data[i].x, data[i].y, data[i].title, true, data[i].id)
    }
}

// Clears elements for loading new ones
function clearMap() {
    document.getElementById("translate").innerHTML = ""
}

let linkStart = 0;
let linkEnd = 0;
let linkInProgress = false;

function link(i) {
    console.log('link ' + i)
    linkStart = i;
    linkInProgress = true;
}

function linkTo(i) {
    console.log('linkTo ' + i)
    linkEnd = i
    // Check same i
    if (linkInProgress && linkStart != linkEnd) {
        data[linkStart].connection = linkEnd;
        linkInProgress = false;
    }
}

function removeElem(i) {
    data.splice(i, 1)
    for (let index = 0; index < data.length; index++) {
        if (data[i].connection == i) {
            data[i].connection = null
        }
    }
    // document.removeChild(document.getElementById('card-0'))
    clearMap()
    loadCards()
}

let moveCardI = 0
let moveFlag = false
function moveElem(i) {
    let card = document.getElementById(`card-${i}`)
    data[i].x = Math.floor((mouse.x - cameraPos.x) / zoom - card.offsetWidth / 2)
    data[i].y = Math.floor((mouse.y - cameraPos.y) / zoom - card.offsetHeight / 2)
    card.style.top = `${data[i].y}px`
    card.style.left = `${data[i].x}px`
}

function newCard(i, x, y, t) {
    if (t == undefined) { t = "" };

    let card = document.createElement('span');
    card.id = "card-" + i;
    card.style = "left:" + Math.floor(x) + "px; top:" + Math.floor(y) + "px";
    card.classList.add('object');
    card.onclick = function () { linkTo(i) };

    let p = document.createElement('p');
    p.classList.add('text')
    p.contentEditable = true
    p.innerHTML = t
    // p.id = `p-${i}`
    p.onkeyup = function () {
        data[i].title = p.innerHTML
    };
    card.appendChild(p)

    let actions = document.createElement('div');
    actions.classList.add("actions")

    let linkElem = document.createElement('button');
    linkElem.innerHTML = `
    <span class='material-symbols-outlined'>
        share
    </span>
    `
    linkElem.classList.add("actions-button")
    linkElem.id = 'link-button'
    linkElem.onclick = function () { link(i) };
    actions.appendChild(linkElem)

    let remove = document.createElement('button');
    remove.innerHTML = `
    <span class="material-symbols-outlined">
        delete
    </span>
    `
    remove.classList.add("actions-button")
    remove.id = 'remove-button'
    remove.onclick = function () { removeElem(i) };
    actions.appendChild(remove)

    let move = document.createElement('button');
    move.innerHTML = `
    <span class="material-symbols-outlined">
        open_with
    </span>
    `
    move.classList.add("actions-button")
    move.id = 'move-button'
    move.onmousedown = function () {
        moveFlag = true;
        moveCardI = i;
    };
    // move.onmouseup = function () { moveFlag = false };
    actions.appendChild(move)

    card.appendChild(actions)

    return card;
    // `
    // <span id="card-${i}" style="..." class="..." onclick="...">
    // <p contenteditable role="textbox" class="text">${t}</p>
    // <button class="link" onclick="link(${i})">Link</button>
    // </span>
    // `;
}


let add = false; // Add card
let largest = 0;
function addCard(x, y, t, newInstance, i) {
    // Hardcoded solution for now
    // The textbox will always be placed with the default "Enter text" meaning its width will
    // always be the same
    // The width is 136, height is 79

    if (newInstance) {
        document.getElementById("translate").appendChild(newCard(i, x - 136 / 2, y - 79 / 2, t));
    } else {
        for (let i = 0; i < data.length; i++) {
            if (data[i].id >= largest) { largest = data[i].id }
        }
        document.getElementById("translate").appendChild(newCard(largest + 1, x - 136 / 2, y - 79 / 2, t));
        data.push(new util.cardObject(x, y, "", null, largest + 1))
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

    targetX = (canvas.width / 2) / zoom, targetY = (canvas.height / 2) / zoom;
    mouse = new util.vector2D(0, 0);

    // Handle card movement
    // Mouse events are up in card creation
    document.addEventListener('mousemove', function (e) {
        if (moveFlag) {
            mouse.x = e.pageX;
            mouse.y = e.pageY;
            moveElem(moveCardI);
        }
    })

    document.addEventListener('mouseup', function (e) {
        moveFlag = false;
    })

    const container = document.getElementById("container");

    canvas.addEventListener('dblclick', function (e) {
        e.preventDefault();
        addCard(Math.floor((mouse.x - cameraPos.x) / zoom), Math.floor((mouse.y - cameraPos.y) / zoom));
    }, true);
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        return false
    })
    canvas.addEventListener('mousedown', function (e) {
        if (add) {
            addCard(Math.floor((mouse.x - cameraPos.x) / zoom), Math.floor((mouse.y - cameraPos.y) / zoom));
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

    canvas.addEventListener('mousemove', function (e) {
        mouse.x = e.pageX;
        mouse.y = e.pageY;

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

    canvas.addEventListener('mouseup', function () {
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

    loadCards()

    const fileInput = document.getElementById('openFile');
    fileInput.onchange = async function () {
        // let selectedFile = fileInput.files[0];
        let file = new FileReader();
        file.onload = () => {
            // console.log(file.result)
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
            data = []
            for (let i = 0; i < fileData.length; i++) {
                data.push(new util.cardObject(
                    fileData[i].x,
                    fileData[i].y,
                    fileData[i].title,
                    fileData[i].connection,
                    fileData[i].id)
                )

            }
            clearMap()
            loadCards()
            console.log(data)

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
        for (let i = 0; i < data.length; i++) {
            saveData.data.push(
                {
                    "x": data[i].x,
                    "y": data[i].y,
                    "title": data[i].title,
                    "connection": data[i].connection,
                    "id": data[i].id,
                }
            )
        }
        download(JSON.stringify(saveData), saveData.title, "application/json")
    }

    function main(currentTime) {
        window.requestAnimationFrame(main);

        let translateLerpScale = 0.9;

        zoom = util.lerp(zoom, zoomTarget, 0.3);
        cameraPos.x = util.lerp(cameraPos.x, targetX, translateLerpScale);
        cameraPos.y = util.lerp(cameraPos.y, targetY, translateLerpScale);
        ctx.fillStyle = "#fff"
        container.style.transform = `translate(${cameraPos.x}px, ${cameraPos.y}px) scale(${zoom})`;

        // Template get position of cursor in "map space"
        // document.getElementById(`card-0`).style.left = `${(mouse.x - cameraPos.x) / zoom}px`
        // document.getElementById(`card-0`).style.top = `${(mouse.y - cameraPos.y) / zoom}px`

        // Zoom needs fixing, needs to be anchored in the middle of the screen not 0, 0
        // ctx.fillStyle = backgroundColor; // Background colour
        // ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // console.log(mouse.x, cameraPos.x, zoom, (mouse.x + cameraPos.x) - canvas.width / 2)
        // ctx.fillRect((mouse.x + cameraPos.x) - canvas.width / 2 - 25, (mouse.y - cameraPos.y) + canvas.height / 2 - 25, 50, 50)

        // Constants
        let curveWidth = Math.floor(50 * zoom)
        let limiter = 5; // Limiter before the line connection direction changes

        ctx.fillStyle = "#fff"
        ctx.strokeStyle = "rgba(200, 200, 200, 1)"
        ctx.lineWidth = 2 * zoom

        // Connection lines

        // Get element connecting to other element
        let elem = document.getElementById(`card-${data[linkStart].id}`)
        let x2 = Math.floor(-elem.style.left.replace('px', '') * zoom - cameraPos.x)
        let y2 = Math.floor(-elem.style.top.replace('px', '') * zoom - cameraPos.y)

        // Get other element
        // let root = document.getElementById(`card-${data[i].connection}`)
        console.log(Math.tan(-(-mouse.x - x2) / (-mouse.y - y2)))
        let triRad = 4
        let xr = -mouse.x
        let yr = -mouse.y - triRad * 2 * zoom
        // xr += 4 * Math.tan(-(-mouse.x - x2) / (-mouse.y - y2)) * (triRad * 2 * zoom)
        let number = 5;

        if (linkInProgress) {
            let elem = document.getElementById(`card-${data[linkStart].id}`)
            let x2 = Math.floor(-elem.style.left.replace('px', '') * zoom - cameraPos.x)
            let y2 = Math.floor(-elem.style.top.replace('px', '') * zoom - cameraPos.y)

            // Get other element
            // let root = document.getElementById(`card-${data[i].connection}`)
            console.log(Math.tan(-(-mouse.x - x2) / (-mouse.y - y2)))
            let triRad = 4
            let xr = -mouse.x
            let yr = -mouse.y - triRad * 2 * zoom
            if (x2 < xr) {
                curveWidth = Math.floor(150 * zoom) * util.clamp(0.1, (xr - x2) / zoom / 500, 1)
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


        for (let i = 0; i < data.length; i++) {
            if (data[i].connection == null) {
                continue
            }

            curveWidth = Math.floor(50 * zoom) // Set default

            // Get element connecting to other element
            let elem = document.getElementById(`card-${data[i].id}`)
            let x2 = Math.floor(-elem.style.left.replace('px', '') * zoom - cameraPos.x)
            let y2 = Math.floor(-elem.style.top.replace('px', '') * zoom - cameraPos.y)

            // Get other element
            let root = document.getElementById(`card-${data[i].connection}`)
            let xr = Math.floor(-root.style.left.replace('px', '') * zoom - cameraPos.x)
            let yr = Math.floor(-root.style.top.replace('px', '') * zoom - cameraPos.y)

            // Styling



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