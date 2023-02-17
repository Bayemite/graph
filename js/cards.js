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
    // key is card-'0', corresponds to html id
    constructor () {
        // id -> CardObject
        this.cardsData = new Map();
        this.cardIds = new util.IDAssign();

        this.linkStart = -1;
        this.linkInProgress = false;

        this.moveCardI = 0;
        this.moveFlag = false;
        this.moveCardOffset = new util.vector2D(0, 0);

        this.cardColours = {};

        // External callback
        this.sendData = function () { };

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

    set(key, value, shouldSendData = false) {
        this.cardsData.set(key, value);

        if (shouldSendData) {
            this.sendData(key, value);
        }
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
        document.getElementById('break').appendChild(breakLink);
    }

    removeBreakLink(start, end) {
        document.getElementById('break').removeChild(document.getElementById(`unlink-${start}-${end}`));
    }

    deleteLink(start, end) {
        this.cardsData.get(start).connection.delete(end);
        removeBreakLink(start, end);
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
            let unlinkContainer = document.getElementById('break');
            for (let connection of connections.values())
                unlinkContainer.removeChild(document.getElementById(`unlink-${i}-${connection}`));
        }

        for (let [cardId, card] of this.cardsData) {
            if (card.connection.has(i)) {
                card.connection.delete(i);
                console.log(document.getElementById('break'));
                console.log(`unlink-${cardId}-${i}`);
                document.getElementById('break').removeChild(document.getElementById(`unlink-${cardId}-${i}`));
            }
        }

        this.cardsData.delete(i);
        cardIds.freeId(i);

        document.getElementById('translate').removeChild(document.getElementById(`card-${i}`));
    }

    moveElem() {
        let i = moveCardI;
        let card = document.getElementById(`card-${i}`);
        let x = Math.floor((mouse.x - cameraPos.x - moveCardOffset.x) / zoom);
        let y = Math.floor((mouse.y - cameraPos.y - moveCardOffset.y) / zoom);
        let cardData = this.cardsData.get(i);
        this.set(i, new CardObject(x, y, cardData.title, cardData.connection, cardData.colour));

        card.style.top = `${this.cardsData.get(i).y}px`;
        card.style.left = `${this.cardsData.get(i).x}px`;
    }

    clearHtmlCards() {
        document.getElementById("translate").innerHTML = `
    <div id="break"></div>
    `;
    }

    genHTMLCard(id, x, y, title) {
        if (title == undefined) { title = ""; };

        let cardContainer = document.createElement('div');

        cardContainer.id = "card-" + id;
        cardContainer.style = "left:" + Math.floor(x) + "px; top:" + Math.floor(y) + "px";
        cardContainer.classList.add('object');
        cardContainer.onclick = () => this.linkTo(id);

        cardContainer.onmousedown = function (e) {
            this.moveFlag = true;
            this.moveCardI = id;

            this.moveCardOffset.x = mouse.x - e.target.getBoundingClientRect().left;
            this.moveCardOffset.y = mouse.y - e.target.getBoundingClientRect().top;
        };
        cardContainer.onmousemove = function () {
            if (this.moveFlag) {
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
            let cardData = self.cardsData.get(id);
            p.oninput = () => self.set(
                id, new CardObject(cardData.x, cardData.y, p.innerHTML, cardData.connection, cardData.colour)
            );

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

            let deleteDialog = new util.Dialog(
                "Warning", "Are you sure you want to delete this card? This will delete all of its connections.",
                true, "Cancel", self.deleteElem, id, "Delete"
            );
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
            const callback = (mutationList, observer) => {
                for (const mutation of mutationList) {
                    if (mutation.attributeName == 'style') {
                        // Set colour variables
                        let color = colorEdit.style.color;
                        cardContainer.style.borderColor = color;
                        this.cardsData.get(id).colour = color;
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
    addDefaultCardHtml() {
        let id = this.cardIds.getNextId();
        this.addCardHTML(
            Math.floor((mouse.x - cameraPos.x) / zoom),
            Math.floor((mouse.y - cameraPos.y) / zoom),
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
                addUnlink(cardId, c);
        }
    }

    loadFromJSON(parsedData) {
        document.getElementById("title").innerText = parsedData.title;
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

    genSave() {
        let saveData = {
            title: document.getElementById("title").innerText,
            data: {}
        };
        for (let [cardId, card] of this.cardsData) {
            saveData.data[cardId] = {
                "x": card.x,
                "y": card.y,
                "title": card.title,
                "connection": Array.from(card.connection),
                // "id": card.id,
                "colour": card.colour,
            };
        }
        return JSON.stringify(saveData);
    };
}