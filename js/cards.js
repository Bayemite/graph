import * as util from './util.js';

export class CardObject {
    constructor (x, y, t, c, colour) {
        this.x = x;
        this.y = y;
        this.title = t;
        this.connection = c;
        this.colour = colour;
    }
}

export class CardsData {
    // HTML ID notes:
    // - card id: `card-{cardId, from this.cardIds}`
    // - unlink id: `unlink-{fromCardId}-{toCardId}`

    /*
        sendUpdateData() {
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
        };
    */

    constructor () {
        // id -> CardObject
        this.cardsData = new Map();
        this.cardIds = new util.IDAssign();

        this.linkStart = -1;
        this.linkInProgress = false;

        this.moveCardID = 0;
        this.moveFlag = false;
        this.moveCardOffset = new util.vector2D(0, 0);

        this.cardColours = {};

        this.set(
            this.cardIds.getNextId(),
            new CardObject(
                0, 0,
                '',
                new Set(),
                'rgb(200, 200, 200)'
            )
        );
        this.set(
            this.cardIds.getNextId(),
            new CardObject(
                200, 100,
                'Title',
                new Set([0]),
                'rgb(200, 200, 200)'
            )
        );
    }

    set(key, value) {
        this.cardsData.set(key, value);
    }

    addUnlink(start, end) {
        let breakLink = document.createElement('button');
        breakLink.classList.add('connection-button');
        breakLink.id = `unlink-${start}-${end}`;
        breakLink.innerHTML = `
                <span class="material-symbols-outlined">
                    delete
                </span>
                `;
        breakLink.onclick = () => this.deleteLink(start, end);

        breakLink.style.left = `${100}px`;
        this.getBreakLinkTag().appendChild(breakLink);
    }

    removeBreakLink(start, end) {
        this.getBreakLinkTag().removeChild(document.getElementById(`unlink-${start}-${end}`));
    }

    deleteLink(start, end) {
        this.cardsData.get(start).connection.delete(end);
        this.removeBreakLink(start, end);
    }

    // i : id of card (card-'0')
    // End the link with linkTo
    startLink(i) {
        this.linkStart = i;
        this.linkInProgress = true;
    }

    // i : id of card
    linkTo(linkEnd) {
        if (!this.linkInProgress) return;

        if (this.cardsData.get(linkEnd) === undefined) {
            console.log(linkEnd + " linkEnd is undefined.");
        }
        // Disallow reconnection
        if (this.cardsData.get(linkEnd).connection.has(this.linkStart)) {
            this.linkInProgress = false;
            return;
        }

        // Disallow same connection
        if (this.cardsData.get(this.linkStart).connection.has(linkEnd)) {
            this.linkInProgress = false;
            return;
        }

        // If click on self just ignore
        if (this.linkStart == linkEnd) return;

        this.cardsData.get(this.linkStart).connection.add(linkEnd);
        this.linkInProgress = false;
        this.addUnlink(this.linkStart, linkEnd);
    }

    deleteElem(i) {
        if (this.linkInProgress) return;

        let connections = this.cardsData.get(i).connection;
        if (connections.size > 0) {
            let unlinkContainer = this.getBreakLinkTag();
            for (let connection of connections.values())
                unlinkContainer.removeChild(document.getElementById(`unlink-${i}-${connection}`));
        }

        for (let [cardId, card] of this.cardsData) {
            if (card.connection.has(i)) {
                card.connection.delete(i);
                console.log(this.getBreakLinkTag());
                console.log(`unlink-${cardId}-${i}`);
                this.getBreakLinkTag().removeChild(document.getElementById(`unlink-${cardId}-${i}`));
            }
        }

        this.cardsData.delete(i);
        this.cardIds.freeId(i);

        document.getElementById('translate').removeChild(document.getElementById(`card-${i}`));
    }

    // camera: util.Camera class
    moveElem(camera) {
        let i = this.moveCardID;
        let card = document.getElementById(`card-${i}`);
        let x = Math.floor((camera.mousePos.x - camera.pos.x - this.moveCardOffset.x) / camera.zoom);
        let y = Math.floor((camera.mousePos.y - camera.pos.y - this.moveCardOffset.y) / camera.zoom);
        let cardData = this.cardsData.get(i);
        this.set(i, new CardObject(x, y, cardData.title, cardData.connection, cardData.colour));

        card.style.top = `${this.cardsData.get(i).y}px`;
        card.style.left = `${this.cardsData.get(i).x}px`;
    }

    clearHtmlCards() {
        document.getElementById("translate").innerHTML =
            `<div id="break"></div>`;
    }

    genHTMLCard(id, x, y, title) {
        if (title == undefined) { title = ""; };

        let cardContainer = document.createElement('div');

        cardContainer.id = "card-" + id;
        cardContainer.style = "left:" + Math.floor(x) + "px; top:" + Math.floor(y) + "px";
        cardContainer.classList.add('object');
        cardContainer.onclick = () => this.linkTo(id);

        // Needed to force reference to class within callback, and not tag
        let that = this;
        cardContainer.onmousedown = function (e) {
            that.moveFlag = true;
            that.moveCardID = id;

            that.moveCardOffset.x = e.pageX - e.target.getBoundingClientRect().left;
            that.moveCardOffset.y = e.pageY - e.target.getBoundingClientRect().top;
        };
        cardContainer.onmousemove = function () {
            if (that.moveFlag) {
                let card = cardContainer.getElementsByTagName('span')[0];
                card.getElementsByTagName('p')[0].blur();
            }
        };

        // sectioned into separate inline functions
        cardContainer.appendChild(cardHTML(this));
        cardContainer.appendChild(editUI(this));

        function cardHTML(self) {
            let card = document.createElement('span');

            let p = document.createElement('p');
            p.classList.add('text', 'card-text');
            p.contentEditable = true;
            p.innerHTML = title;

            p.addEventListener('input', () => {
                self.cardsData.get(id).title = p.innerHTML;
            });

            card.appendChild(p);

            return card;
        }
        function editUI(self) {
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
            linkElem.onclick = function () { self.startLink(id); };
            actions.appendChild(linkElem);

            let deleteCard = document.createElement('button');
            deleteCard.innerHTML = `
            <span class="material-symbols-outlined">
                delete
            </span>
            `;
            deleteCard.classList.add("actions-button");
            deleteCard.onclick = () => { self.deleteElem(id); };
            actions.appendChild(deleteCard);

            let clrPicker = document.createElement('div');
            clrPicker.classList.add('color-picker');
            let colorEdit = document.createElement('div');
            let colorInput = document.createElement('input');
            colorInput.onchange = function () {
                // Set colour swatch settings
                this.cardColours[id] = colorEdit.style.color;
                window.colorSettings(Object.values(this.cardColours));
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
            let that = this;
            const callback = (mutationList, observer) => {
                for (const mutation of mutationList) {
                    if (mutation.attributeName == 'style') {
                        // Set colour variables
                        let color = colorEdit.style.color;
                        cardContainer.style.borderColor = color;
                        that.cardsData.get(id).colour = color;
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
            return actions;
        }

        return cardContainer;
    }

    addCardHTML(x, y, t, cardId, connection, colour) {
        util.checkArgs(arguments, 6);
        // Hardcoded solution for now
        // The textbox will always be placed with the default "Enter text" meaning its width will
        // always be the same
        // The width is 136, height is 79

        document.getElementById("translate").appendChild(
            this.genHTMLCard(cardId, x - 136 / 2, y - 79 / 2, t)
        );
        let cardContainer = document.getElementById(`card-${cardId}`);
        // Set colour
        cardContainer.style.borderColor = colour;
        let components = util.colorValues(colour);
        components[3] = 0.1;
        cardContainer.style.backgroundColor = "rgba(" + components.join(", ") + ")";
        this.set(cardId, new CardObject(x, y, "", connection, colour));
    }

    // returns id of card
    // camera: util Camera class, attributes read only
    // pos: should have .x and .y (eg. util vector2D)
    addDefaultCardHtml(pos) {
        let id = this.cardIds.getNextId();
        this.addCardHTML(
            pos.x,
            pos.y,
            "",
            id,
            new Set(),
            "rgb(200, 200, 200)"
        );
        return id;
    }

    // Bulk load all cards from this.cardsData to HTML.
    // Removes all existing cards in the HTML.
    addCardsHTML() {
        this.clearHtmlCards();
        for (const [cardId, card] of this.cardsData) {
            this.addCardHTML(card.x, card.y, card.title, cardId, card.connection, card.colour);
            if (card.connection.size == 0) { continue; }

            for (let c of card.connection.values())
                this.addUnlink(cardId, c);
        }
    }

    getTitleTag() {
        return document.getElementById("title");
    }

    getBreakLinkTag() {
        return document.getElementById('break');
    }

    loadFromJSON(parsedData) {
        this.getTitleTag().innerText = parsedData.title;
        parsedData = parsedData.data;
        this.cardsData.clear();
        let maxId = 0;
        for (let i of Object.keys(parsedData)) {
            maxId = Math.max(i, maxId);
            let iValues = Object.values(parsedData)[i];
            if (!iValues) continue;
            this.set(i,
                new CardObject(
                    iValues.x,
                    iValues.y,
                    iValues.title,
                    new Set(Array.from(iValues.connection)),
                    iValues.colour
                )
            );

        }
        this.cardIds.next = maxId + 1;
    }

    genSave(stringify = true) {
        let saveData = {
            title: this.getTitleTag().innerText,
            data: {}
        };
        for (let [cardId, card] of this.cardsData) {
            saveData.data[cardId] = {
                "x": card.x,
                "y": card.y,
                "title": card.title,
                "connection": Array.from(card.connection),
                "colour": card.colour,
            };
        }
        if (stringify)
            saveData = JSON.stringify(saveData);
        return saveData;

    };
}