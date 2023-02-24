import * as util from './util.js';

const defaultColor = "rgb(200, 200, 200)";

export class CardObject {
    constructor (pos = util.vec2(), text = "", connectionSet = new Set(), color = defaultColor) {
        this.pos = pos;
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

    // cmd is {undo: Function, redo: Function}
    addUndoCmd(cmd) {
        this.undoStack.push(cmd);
    }

    undo() {
        if (this.undoStack.length > 0) {
            let cmd = this.undoStack.pop();
            cmd.undo();
            this.redoStack.push(cmd);
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            let cmd = this.redoStack.pop();
            cmd.redo();
            this.undoStack.push(cmd);
        }
    }
}

function getCardTag(id) {
    return document.getElementById(`card-${id}`);
}

function getTitleTag() {
    return document.getElementById("title");
}

function getBreakLinkContainerTag() {
    return document.getElementById('break-link-btns-container');
}

function getCardContainerTag() {
    return document.getElementById("translate");
}

function clearHtmlCards() {
    getCardContainerTag().innerHTML = `<div id="break-link-btns-container"></div>`;
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
        this.moveCardOffset = util.vec2();

        this.focusCardID = -1;

        this.cardColors = new Set();

        this.undoRedoStack = new UndoRedoStack();

        this.addNewCard(new CardObject());
        this.addNewCard(
            new CardObject(
                util.vec2(200, 100),
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

    addLink(start, end) {
        this.cardsData.get(start).connections.add(end);

        let breakLink = document.createElement('button');
        breakLink.classList.add('break-link-button');
        breakLink.id = `unlink-${start}-${end}`;
        breakLink.innerHTML = `
                <span class="material-symbols-outlined">
                    delete
                </span>
                `;
        breakLink.onclick = () => this.deleteLink(start, end);

        getBreakLinkContainerTag().appendChild(breakLink);
    }

    deleteLink(start, end, addUndo = true) {
        this.cardsData.get(start).connections.delete(end);
        getBreakLinkContainerTag().removeChild(document.getElementById(`unlink-${start}-${end}`));

        if (addUndo)
            this.undoRedoStack.addUndoCmd(
                {
                    undo: () => this.addLink(start, end),
                    redo: () => this.deleteLink(start, end, false)
                }
            );
    }

    // i : id of card (card-'0')
    // End the link with endLink
    startLink(i) {
        this.linkStart = i;
        this.linkInProgress = true;
    }

    // i : id of card
    endLink(linkEnd, addUndo = true) {
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

        this.linkInProgress = false;
        this.addLink(this.linkStart, linkEnd);

        if (addUndo) {
            let linkStart = this.linkStart;
            this.undoRedoStack.addUndoCmd(
                {
                    undo: () => this.deleteLink(linkStart, linkEnd, false),
                    redo: () => this.addLink(linkStart, linkEnd)
                }
            );
        }
    }

    deleteCard(id, addUndo = true) {
        if (this.linkInProgress) return;

        // Retain data for undo
        let deletedCard = structuredClone(this.cardsData.get(id));

        let connections = this.cardsData.get(id).connections;
        connections.forEach(endId => { this.deleteLink(id, endId, false); });

        let linksToDeletedCard = [];
        for (let [cardId, card] of this.cardsData) {
            if (card.connections.has(id)) {
                this.deleteLink(cardId, id, false);
                linksToDeletedCard.push(cardId);
            }
        }

        this.cardsData.delete(id);
        document.getElementById('translate').removeChild(getCardTag(id));

        if (addUndo) {
            this.undoRedoStack.addUndoCmd({
                undo: () => {
                    this.set(id, deletedCard);
                    this.addCardHTML(id);
                    deletedCard.connections.forEach(endId => { this.addLink(id, endId); });
                    linksToDeletedCard.forEach(startLinkId => { this.addLink(startLinkId, id); });

                    this.focusCard(-1);
                },
                redo: () => this.deleteCard(id, false)
            });
        }
    }

    moveElem() {
        let id = this.moveCardID;
        const camera = window.camera;

        let cardData = this.cardsData.get(id);
        let pos = camera.globalCoords(camera.mousePos);
        cardData.pos.x = pos.x - (this.moveCardOffset.x / camera.zoom);
        cardData.pos.y = pos.y - (this.moveCardOffset.y / camera.zoom);

        let card = getCardTag(id);
        card.getElementsByClassName("text")[0].blur();
        // TODO: undo/redo
        card.style.left = `${cardData.pos.x}px`;
        card.style.top = `${cardData.pos.y}px`;
    }

    // Returns {background: "rgba(...)", border: "rgba(...)"}
    borderBackgroundColors(color = defaultColor) {
        let components = util.colorValues(color);
        components = components.map(c => c / 4);
        components[3] = 1; // Force alpha
        let backgroundColor = "rgba(" + components.join(", ") + ")";
        return { background: backgroundColor, border: color };
    }

    htmlEditUI(id) {
        let editRootNode = document.createElement('div');
        editRootNode.classList.add("actions");

        let linkElem = document.createElement('button');
        linkElem.innerHTML = `
        <span class="material-symbols-outlined">
            call_split
        </span>
        `;
        linkElem.classList.add("actions-button", "link-button");
        linkElem.onclick = () => { this.startLink(id); };
        editRootNode.appendChild(linkElem);

        let deleteCard = document.createElement('button');
        deleteCard.innerHTML = `
        <span class="material-symbols-outlined">
            delete
        </span>
        `;
        deleteCard.classList.add("actions-button");
        deleteCard.addEventListener('click', () => { this.deleteCard(id); });
        editRootNode.appendChild(deleteCard);

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
        editRootNode.appendChild(colorEdit);

        let that = this;
        colorInput.onchange = function () {
            // Set color swatch settings
            that.cardColors.add(colorEdit.style.color);
            window.colorSettings(Array.from(that.cardColors));
        };
        let cardData = that.cardsData.get(id);
        colorEdit.oninput = function () {
            // TODO: undo/redo
            // Set color variables
            let color = colorEdit.style.color;
            cardData.color = color;
            let colors = that.borderBackgroundColors(color);
            let cardTag = getCardTag(id);
            cardTag.style.borderColor = colors.border;
            cardTag.style.backgroundColor = colors.background;
        };
        colorEdit.style.color = cardData.color;

        return editRootNode;
    }

    // let id = -1 to unfocus without focusing on another.
    focusCard(id) {
        if (id === this.focusCardID) return;
        if (this.focusCardID != -1) {
            let unfocused = getCardTag(this.focusCardID);
            if (!unfocused) { this.focusCardID = -1; return; }
            let editUI = unfocused.getElementsByClassName("actions")[0];
            if (editUI)
                unfocused.removeChild(editUI);
        }
        this.focusCardID = id;
        if (this.focusCardID != -1) {
            let focused = getCardTag(this.focusCardID);
            focused.appendChild(this.htmlEditUI(id));

            // Change z-index to top by physically moving DOM location
            // and cardsData map insertion order *hack?*
            getCardContainerTag().appendChild(focused);
            let data = this.cardsData.get(id);
            this.cardsData.delete(id);
            this.set(id, data);
        }
    }

    // Generate all HTML data for card except for position
    // which is deferred to after appendChild, to align to centre using client bounds.
    genHTMLCard(id) {
        let cardObject = this.cardsData.get(id);

        let cardContainer = document.createElement('div');
        cardContainer.id = "card-" + id;

        let style = cardContainer.style;
        cardContainer.classList.add('card');

        let colors = this.borderBackgroundColors(cardObject.color);
        style.borderColor = colors.border;
        style.backgroundColor = colors.background;

        // Needed to reference 'this' class within callback, instead of 'this' tag
        let that = this;
        function mouseDown(e) {
            // TODO: undo/redo
            e.stopPropagation();

            if (that.focusCardID === id) {
                that.moveFlag = true;
                that.moveCardID = id;
            }

            that.focusCard(id);

            let boundRect = cardContainer.getBoundingClientRect();
            let mousePos;
            if (e.touches) mousePos = util.vec2(e.touches[0].pageX, e.touches[0].pageY);
            else mousePos = util.vec2(e.pageX, e.pageY);
            that.moveCardOffset.x = mousePos.x - boundRect.left;
            that.moveCardOffset.y = mousePos.y - boundRect.top;

            if (that.linkInProgress)
                that.endLink(id);

            cardContainer.getElementsByClassName('text')[0].focus();
        }
        cardContainer.onmousedown = mouseDown;
        cardContainer.ontouchstart = mouseDown;

        // sectioned into separate inline function
        cardContainer.appendChild(cardHTML(this));

        return cardContainer;

        function cardHTML(that) {
            let p = document.createElement('p');
            p.classList.add('text');
            p.contentEditable = true;
            p.innerHTML = cardObject.text;

            p.oninput = () => {
                // TODO: undo/redo
                cardObject.text = p.innerHTML;
            };

            p.onmouseup = () => { p.focus(); };

            return p;
        }
    }

    // Add to data, returns id.
    addNewCard(cardObject = new CardObject()) {
        let id = this.cardIds.getNextId();
        this.set(id, cardObject);
        return id;
    }

    // Add a card from data to HTML.
    addCardHTML(cardId, adjustOriginCentre = false) {
        let cardContainer = getCardContainerTag().appendChild(
            this.genHTMLCard(cardId)
        );

        let cardObject = this.cardsData.get(cardId);
        if (adjustOriginCentre) {
            let boundRect = cardContainer.getBoundingClientRect();
            cardObject.pos.x -= boundRect.width / 2 / window.camera.zoom;
            cardObject.pos.y -= boundRect.height / 2 / window.camera.zoom;
        }
        cardContainer.style.left = cardObject.pos.x + "px";
        cardContainer.style.top = cardObject.pos.y + "px";
    }

    // returns id of card
    // pos: should have .x and .y (eg. util Vector2D)
    // adjustOriginToCenter: pos = centre of card instead of top left
    addDefaultCardHtml(pos = util.vec2(), adjustOriginCentre = false) {
        let id = this.addNewCard(new CardObject(pos));
        this.addCardHTML(id, adjustOriginCentre);
        return id;
    }

    // Bulk load all cards from this.cardsData to HTML.
    // Removes all existing cards in the HTML.
    addCardsHTML() {
        clearHtmlCards();
        for (const [cardId, card] of this.cardsData) {
            this.addCardHTML(cardId);
            if (card.connections.size == 0) { continue; }

            for (let c of card.connections.values())
                this.addLink(cardId, c);
        }
    }

    loadFromJSON(parsedData) {
        getTitleTag().innerText = parsedData.title;
        this.cardsData.clear();

        let lastId = 0;
        for (let card of parsedData.cards) {
            lastId = Math.max(lastId, card.id);
            if (!CSS.supports('color'), card.color)
                card.color = defaultColor;
            this.set(Number(card.id),
                new CardObject(
                    util.vec2(card.x, card.y),
                    card.text,
                    new Set(Array.from(card.connections)),
                    card.color
                )
            );
        }
        this.cardIds.next = lastId + 1;
    }

    genSave() {
        let saveData = {
            title: getTitleTag().innerText,
            cards: []
        };
        for (let [cardId, card] of this.cardsData) {
            saveData.cards.push({
                "id": cardId,
                "x": card.pos.x,
                "y": card.pos.y,
                "text": card.text,
                "connections": Array.from(card.connections),
                "color": card.color,
            });
        }
        return saveData;
    };
}