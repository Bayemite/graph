import * as util from './util.js';

const defaultColor = "rgb(200, 200, 200)";

export class CardObject {
    constructor (pos = new util.vector2D(), text = "", connectionSet = new Set(), color = defaultColor) {
        this.x = pos.x;
        this.y = pos.y;
        this.text = text;
        this.connections = connectionSet;
        this.color = color;
    }
}

class UndoRedoStack {
    constructor () {
        this.undoStack = [];
        this.redoStack = [];
    }

    // undoCmd: Function
    addUndoCmd(undoCmd) {
        this.undoStack.push(undoCmd);
    }

    undo() {
        if (this.undoStack.length > 0) {
            let undoCmd = this.undoStack.pop();
            undoCmd();
            this.redoStack.push(undoCmd);
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            let redoCmd = this.redoStack.pop();
            redoCmd();
            this.undoStack.push(redoCmd);
        }
    }
}

export class CardsData {
    // HTML ID notes:
    // - card id: `card-{cardId, from this.cardIds}`
    // - unlink id: `unlink-{fromCardId}-{toCardId}`

    constructor () {
        // id -> CardObject
        this.cardsData = new Map();
        this.cardIds = new util.IDAssign();

        this.linkStart = -1;
        this.linkInProgress = false;

        this.moveCardID = 0;
        this.moveFlag = false;
        this.moveCardOffset = new util.vector2D(0, 0);

        this.cardColors = new Set();

        this.undoRedoStack = new UndoRedoStack();

        this.addNewCard(new CardObject());
        this.addNewCard(
            new CardObject(
                new util.vector2D(200, 100),
                'Title',
                new Set([0]),
                defaultColor
            )
        );
    }

    undo() {
        this.undoRedoStack.undo();
    }

    set(key, value) {
        this.cardsData.set(key, value);
    }

    addUnlink(start, end) {
        this.cardsData.get(start).connections.add(end);

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
        this.getBreakLinkContainerTag().appendChild(breakLink);
    }


    deleteLink(start, end, addUndo = true) {
        this.cardsData.get(start).connections.delete(end);
        this.getBreakLinkContainerTag().removeChild(document.getElementById(`unlink-${start}-${end}`));

        if (addUndo)
            this.undoRedoStack.addUndoCmd(() => {
                this.addUnlink(start, end);
            });
    }

    // i : id of card (card-'0')
    // End the link with endLink
    startLink(i) {
        this.linkStart = i;
        this.linkInProgress = true;
    }

    // i : id of card
    endLink(linkEnd) {
        if (!this.linkInProgress) return;

        if (this.cardsData.get(linkEnd) === undefined) {
            console.log(linkEnd + " linkEnd is undefined.");
        }
        // Disallow reconnection
        if (this.cardsData.get(linkEnd).connections.has(this.linkStart)) {
            this.linkInProgress = false;
            return;
        }

        // Disallow same connection
        if (this.cardsData.get(this.linkStart).connections.has(linkEnd)) {
            this.linkInProgress = false;
            return;
        }

        // If click on self just ignore
        if (this.linkStart == linkEnd) return;

        // TODO: undo/redo
        this.linkInProgress = false;
        this.addUnlink(this.linkStart, linkEnd);
    }

    deleteCard(id) {
        if (this.linkInProgress) return;

        let connections = this.cardsData.get(id).connections;
        if (connections.size > 0) {
            let unlinkContainer = this.getBreakLinkContainerTag();
            for (let connection of connections.values())
                unlinkContainer.removeChild(document.getElementById(`unlink-${id}-${connection}`));
        }

        for (let [cardId, card] of this.cardsData) {
            if (card.connections.has(id)) {
                this.deleteLink(cardId, id, false);
            }
        }

        // TODO: undo/redo
        this.cardsData.delete(id);
        this.cardIds.freeId(id);

        document.getElementById('translate').removeChild(document.getElementById(`card-${id}`));
    }

    // camera: util.Camera class
    moveElem(camera) {
        let id = this.moveCardID;

        let cardData = this.cardsData.get(id);
        let pos = camera.hoverPos();
        cardData.x = pos.x - (this.moveCardOffset.x / camera.zoom);
        cardData.y = pos.y - (this.moveCardOffset.y / camera.zoom);

        let card = document.getElementById(`card-${id}`);
        // TODO: undo/redo
        card.style.left = `${cardData.x}px`;
        card.style.top = `${cardData.y}px`;
    }

    clearHtmlCards() {
        document.getElementById("translate").innerHTML =
            `<div id="break"></div>`;
    }

    // Returns {background: "rgba(...)", border: "rgba(...)"}
    borderBackgroundColors(color = defaultColor) {
        let components = util.colorValues(color);
        components[3] = 0.1; // Force alpha
        let backgroundColor = "rgba(" + components.join(", ") + ")";
        return { background: backgroundColor, border: color };
    }

    genHTMLCard(id) {
        let cardObject = this.cardsData.get(id);

        let cardContainer = document.createElement('div');

        cardContainer.id = "card-" + id;

        let style = cardContainer.style;
        style.left = cardObject.x + "px;";
        style.top = cardObject.y + "px";

        let colors = this.borderBackgroundColors(cardObject.color);
        style.borderColor = colors.border;
        style.backgroundColor = colors.background;
        cardContainer.classList.add('card');

        // Needed to force reference to class within callback, and not tag
        let that = this;
        cardContainer.onmousedown = function (e) {
            that.moveFlag = true;
            that.moveCardID = id;

            let boundRect = cardContainer.getBoundingClientRect();
            that.moveCardOffset.x = e.clientX - (boundRect.left + window.scrollX);
            that.moveCardOffset.y = e.clientY - (boundRect.top + window.scrollY);

            if (that.linkInProgress)
                that.endLink(id);
        };

        // sectioned into separate inline functions
        cardContainer.appendChild(cardHTML(this));
        cardContainer.appendChild(editUI(this));

        function cardHTML(that) {
            let p = document.createElement('p');
            p.classList.add('text');
            p.contentEditable = true;
            p.innerHTML = cardObject.text;

            p.oninput = () => {
                // TODO: undo/redo
                cardObject.text = p.innerHTML;
            };

            // Allow move without text focus
            p.onmousedown = (e) => { e.preventDefault(); };
            p.onmouseup = () => { p.focus(); };

            return p;
        }
        function editUI(that) {
            let actions = document.createElement('div');
            actions.classList.add("actions");

            let linkElem = document.createElement('button');
            linkElem.innerHTML = `
            <span class='material-symbols-outlined'>
                share
            </span>
            `;
            linkElem.classList.add("actions-button", "link-button");
            linkElem.onclick = () => { that.startLink(id); };
            actions.appendChild(linkElem);

            let deleteCard = document.createElement('button');
            deleteCard.innerHTML = `
            <span class="material-symbols-outlined">
                delete
            </span>
            `;
            deleteCard.classList.add("actions-button");
            deleteCard.onclick = () => { that.deleteCard(id); };
            actions.appendChild(deleteCard);

            let clrPicker = document.createElement('div');
            clrPicker.classList.add('color-picker');

            let colorInput = document.createElement('input');
            colorInput.type = 'text';
            colorInput.value = defaultColor;
            colorInput.setAttribute('data-coloris', true);

            let colorEdit = document.createElement('div');
            colorEdit.classList.add('clr-field');
            colorEdit.style.color = defaultColor;
            colorEdit.innerHTML = `
            <button type="button" aria-labelledby="clr-open-label"></button>
            `;
            colorEdit.appendChild(colorInput);
            clrPicker.appendChild(colorEdit);
            actions.appendChild(colorEdit);

            colorInput.onchange = function () {
                // Set color swatch settings
                that.cardColors.add(colorEdit.style.color);
                window.colorSettings(Array.from(that.cardColors));
            };
            colorEdit.oninput = function () {
                // TODO: undo/redo
                // Set color variables
                let color = colorEdit.style.color;
                cardObject.color = color;
                let colors = that.borderBackgroundColors(color);
                cardContainer.style.borderColor = colors.border;
                cardContainer.style.backgroundColor = colors.background;
            };

            return actions;
        }

        return cardContainer;
    }

    // Add to data, returns id.
    addNewCard(cardObject = new CardObject()) {
        let id = this.cardIds.getNextId();
        this.set(id, cardObject);
        return id;
    }

    // Add a card from data to HTML.
    addCardHTML(cardId) {
        document.getElementById("translate").appendChild(
            this.genHTMLCard(cardId)
        );
    }

    // returns id of card
    // pos: should have .x and .y (eg. util vector2D)
    addDefaultCardHtml(pos = util.vector2D()) {
        let id = this.addNewCard(new CardObject(pos));
        this.addCardHTML(id);
        return id;
    }

    // Bulk load all cards from this.cardsData to HTML.
    // Removes all existing cards in the HTML.
    addCardsHTML() {
        this.clearHtmlCards();
        for (const [cardId, card] of this.cardsData) {
            this.addCardHTML(cardId);
            if (card.connections.size == 0) { continue; }

            for (let c of card.connections.values())
                this.addUnlink(cardId, c);
        }
    }

    getTitleTag() {
        return document.getElementById("title");
    }

    getBreakLinkContainerTag() {
        return document.getElementById('break');
    }

    loadFromJSON(parsedData) {
        this.getTitleTag().innerText = parsedData.title;
        this.cardsData.clear();
        let cardData = parsedData.data;

        let lastId = 0;
        for (const id in cardData) {
            lastId = Math.max(lastId, id);
            let iValues = cardData[id];
            if (!iValues) continue;
            this.set(id,
                new CardObject(
                    new util.vector2D(iValues.x, iValues.y),
                    iValues.text,
                    new Set(Array.from(iValues.connections)),
                    iValues.color
                )
            );
        }
        this.cardIds.next = lastId + 1;
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
                "text": card.text,
                "connections": Array.from(card.connections),
                "color": card.color,
            };
        }
        if (stringify)
            saveData = JSON.stringify(saveData);
        return saveData;

    };
}