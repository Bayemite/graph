import * as util from './util.js';
import * as cards from './cards.js';

let host = false;
let activeConnection = false;
let clientConnection = null;

window.onload = function () {
    // Stub, unused at the moment
    // let peerConnection = new util.PeerConnection();

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    let camera = new util.Camera(canvas.width, canvas.height);
    let cardsData = new cards.CardsData();

    util.addSaveOpenFileListeners(cardsData);
    util.loadLocalSave(cardsData);
    util.addLocalSaveListener();
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mouseup', () => {
        cardsData.moveFlag = false;
        camera.onMouseUp();
    });
    document.addEventListener('mousemove', (event) => {
        // Mouse events are up in card creation
        if (cardsData.moveFlag)
            cardsData.moveElem(camera);

        camera.onMouseMove(event);
    });

    canvas.addEventListener('dblclick', () => {
        cardsData.addDefaultCardHtml(camera.hoverPos());
    });
    canvas.addEventListener('mousedown', (event) => {
        if (cardsData.linkInProgress) {
            if (event.button == 0) {
                let id = cardsData.addDefaultCardHtml(camera.hoverPos());
                cardsData.endLink(id);
            }
            else cardsData.linkInProgress = false;

        }
        else camera.onMouseDown(event);
    });

    document.addEventListener('wheel', (event) => {
        event.preventDefault();
        camera.onWheel(event);
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
                        )
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
                cardsData.loadFromJSON(tryParseJson(data));
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

    cardsData.addCardsHTML();

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