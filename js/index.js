import * as util from './util.js';
import * as cards from './cards.js';

let camera = new util.Camera();
let cardsData = new cards.CardsData(camera);

const backgroundColor = new util.rgb(100, 150, 200);

let host = false;
let activeConnection = false;
let clientConnection = null;

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

    let mouseDown = false;
    // Mouse delta
    let initX = 0, initY = 0;
    let deltaX = 0, deltaY = 0;
    camera.targetX = (canvas.width / 2) / camera.zoom;
    camera.targetY = (canvas.height / 2) / camera.zoom;

    document.addEventListener('mouseup', function (e) {
        cardsData.moveFlag = false;
    });
    canvas.addEventListener('dblclick', function (e) {
        e.preventDefault();
        cardsData.addDefaultCardHtml(camera.hoverPos());
    }, true);
    canvas.addEventListener('mousedown', function (e) {
        if (cardsData.linkInProgress) {
            if (e.button == 0) {
                let id = cardsData.addDefaultCardHtml(camera.hoverPos());
                cardsData.linkTo(id);
            }
            else {
                cardsData.linkInProgress = false;
            }
        }
        else {
            initX = e.pageX, initY = e.pageY;
        }
        mouseDown = true;
    });

    document.addEventListener('mousemove', function (e) {
        camera.mouse.x = e.pageX;
        camera.mouse.y = e.pageY;

        // Handle card movement
        // Mouse events are up in card creation
        if (cardsData.moveFlag) {
            cardsData.moveElem(camera);
        }

        if (mouseDown) {
            deltaX = e.pageX - initX;
            deltaY = e.pageY - initY;
            camera.targetX += deltaX;
            camera.targetY += deltaY;
            initX = e.pageX;
            initY = e.pageY;
        }
    });

    document.onmouseup = event => mouseDown = false;
    window.onmouseup = event => event.preventDefault();

    document.addEventListener('wheel',
        (event) => {
            event.preventDefault();
            let delta = event.wheelDelta;
            let zoomFactor = 0.0007;
            camera.zoomTarget += delta * zoomFactor;

            let zoomOut = 0.3;
            let zoomIn = 3;
            camera.zoomTarget = util.clamp(zoomOut, camera.zoomTarget, zoomIn);
        }, { passive: false }
    );

    function newPeerDialog(id) {
        console.log('My peer ID is: ' + id);
        let hostDialog = new util.Dialog("Host ID", `Others can join your session using the following id: <div onclick='copy(this)'>${id}</div>`, false, "Ok");
        hostDialog.show();
    }

    function connectPeerDialog(conn) {
        console.log("Connected: ");
        console.log(conn);
        let hostDialog = new util.Dialog("User Connected", `A user joined your session: ${conn.peer}`, false, "Ok");
        hostDialog.show();
    }

    document.getElementById("host-peer-button").onclick = function () {
        let peerObject = new Peer("Test");
        peerObject.on('open', (id) => newPeerDialog(id));
        peerObject.on('connection', (conn) => {
            connectPeerDialog(conn);

            conn.on('open', () => {
                const dataToSend = cardsData.genSave();
                console.log(dataToSend);
                // Send the data
                conn.send(dataToSend);

            });

            // Send cardsData to the connected peer
            console.log(cardsData);

            // Listen for incoming data on the dataConnection object
            conn.on('data', (data) => {
                console.log("Received data:", data);
                if (data["type"] == 'updateNodeText') {
                    cardsData.set(data["key"],
                        new cards.cardObject(
                            data["value"].x, data["value"].y, data["value"].title, new Set(data["value"].connection), data["value"].colour
                        ),
                        false // Do not send data
                    );
                    let c = document.getElementById(`card-${data["key"]}`);
                    // let p = the paragraph element with class text inside it
                    let p = c.getElementsByClassName("text")[0];
                    p.innerHTML = data["value"].title;
                    c.style.top = `${data["value"].y}px`;
                    c.style.left = `${data["value"].x}px`;
                }
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
            console.log(`Connected to PeerJS with ID: ${id}`);
            conn = peer.connect(hostId);

            conn.on('open', () => {
                console.log(`Connected to host: ${hostId}`);
                host = false;
                activeConnection = true;
            });

            conn.on("data", (data) => {
                console.log(data);
                // Loads cards and resets and sets cardsData
                cardsData.loadFromJSON(tryParseSave(data));
                cardsData.addCardsHTML();
            });
        });


        peer.on('error', (error) => {
            console.error(error);
        });

        const updateNodeText = function (key, card) {
            if (conn) {
                console.log('conn');
                let data = {
                    "x": card.x,
                    "y": card.y,
                    "title": card.title,
                    "connection": Array.from(card.connection),
                    "colour": card.colour,
                };
                conn.send({ type: 'updateNodeText', key: key, value: data });
            }
        };

        return { conn, updateNodeText };
    }

    document.getElementById("connect-button").onclick = () => {
        const peerId = document.getElementById("peer-id").innerText.trim();
        const { conn, updateNodeText } = connectToHost(peerId);

        clientConnection = conn;
        // NOTE sendData is now in cards.js -> class cardsData as sendUpdateData

        // sendData = function (key, value) {
        //     if (conn) {
        //         conn.send({ type: 'updateNodeText', nodeId: key, text: value });
        //         console.log('conn')
        //     }
        // }
        // Attach mutation observers to existing and new nodes
        // attachObserversToExistingNodes(updateNodeText);
        // attachObserverToNewNodes(updateNodeText);
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
            cardsData.loadFromJSON(fileData);
        };
        file.readAsText(this.files[0]);
        fileInput.value = '';
    };

    let localSave = window.localStorage.getItem('localSave');
    if (localSave)
        cardsData.loadFromJSON(tryParseSave(localSave));
    cardsData.addCardsHTML();

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

    document.getElementById('save').onclick = () => {
        let saveData = cardsData.genSave(false);
        console.log("save title should be " + saveData.title);
        download(JSON.stringify(saveData), saveData.title, "application/json");
    };
    window.onbeforeunload = (e) => {
        window.localStorage.setItem('localSave', cardsData.genSave());
        console.log("Saved to localStorage");
    };

    function main(currentTime) {
        window.requestAnimationFrame(main);
        camera.update();

        // Clear canvas
        ctx.fillStyle = "#fff";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(200, 200, 200, 1)";
        ctx.lineWidth = 2 * camera.zoom;

        if (cardsData.linkInProgress) {
            let linkOriginElem = document.getElementById(`card-${cardsData.linkStart}`);
            util.drawLinkLine(ctx, linkOriginElem, camera);
        }

        for (let [cardId, card] of cardsData.cardsData) {
            if (card.connection.size == 0)
                continue;

            // Get element connecting to other element
            let elem = document.getElementById(`card-${cardId}`);
            if (elem == null) {
                console.log(`card-${cardId} is null`);
                continue;
            }

            util.drawLinks(ctx, cardId, card, elem, camera);
        }
    }

    main(); // Start the cycle
};