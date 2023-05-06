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

        this.moveCardID = -1;
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

    changeFont(i, fontSize) {
        this.cardsData.get(i).fontSize = fontSize;
        getCardTag(i).style.fontSize = fontSize;
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
        let backgroundColor;
        let borderColor;

        // darken background if dark theme, else darken border
        if (util.getTheme() == 'dark') {
            backgroundColor = components.map(c => c / 4);
            backgroundColor[3] = 1;
            borderColor = components;
        }
        else {
            backgroundColor = components;
            borderColor = components.map(c => c / 4);
        }

        backgroundColor = "rgba(" + backgroundColor.join(", ") + ")";
        borderColor = "rgba(" + borderColor.join(", ") + ")";

        return { background: backgroundColor, border: borderColor };
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

        let fontElem = document.createElement('button');
        fontElem.innerHTML = `
        <span class="material-symbols-outlined">
            format_size
        </span>
        `;
        fontElem.classList.add("actions-button", "link-button");
        fontElem.onclick = () => {
            let fSize = "initial";
            if (!this.cardsData.get(id).fontSize) {
                fSize = "1.4rem";
            }
            if (this.cardsData.get(id).fontSize == "initial") {
                fSize = "1.4rem";
            } else if (this.cardsData.get(id).fontSize == "1.4rem") {
                fSize = "initial";
            }
            this.changeFont(id, fSize);
        };
        editRootNode.appendChild(fontElem);

        let imgElem = document.createElement('button');
        imgElem.innerHTML = `
        <span class="material-symbols-outlined">
            add_photo_alternate
        </span>
        `;
        imgElem.classList.add("actions-button");
        imgElem.onclick = () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";

            input.onchange = () => {
                const file = input.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    // TODO: createObjectURL() using an image blob may be superior to data URIs
                    const imageNode = document.createElement("img");
                    imageNode.src = event.target.result;
                    imageNode.alt = "Image";
                    imageNode.classList.add("card-image");

                    const cardContainer = getCardTag(id).querySelector(".text");
                    cardContainer.appendChild(imageNode);

                    this.updateCardContent(id);
                };
                reader.readAsDataURL(file);
            };
            input.click();
        };

        editRootNode.appendChild(imgElem);

        let deleteCard = document.createElement('button');
        deleteCard.innerHTML = `
        <span class="material-symbols-outlined">
            delete
        </span>
        `;
        deleteCard.classList.add("actions-button");
        deleteCard.addEventListener('click', () => { this.deleteCard(id); });
        editRootNode.appendChild(deleteCard);

        let clrPicker = document.createElement('span');
        clrPicker.classList.add('color-picker');

        let colorInput = document.createElement('input');
        colorInput.type = 'text';
        colorInput.value = defaultColor;
        colorInput.autocomplete = false;
        colorInput.spellcheck = false;
        colorInput.setAttribute('data-coloris', true);

        let colorEdit = document.createElement('div');
        colorEdit.classList.add('clr-field');
        colorEdit.style.color = defaultColor;
        colorEdit.innerHTML = `
        <span 
            class="material-symbols-outlined"
            style="position:absolute; 
            top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -50%);
            z-index: 1; color:  var(--color-edit-icon-color);
            transition: color 1s;
            pointer-events: none;" 
        >
            palette
        </span>
        <button type="button" style="margin:0px;"></button>
        `;
        let updateColorIconColor = (color /* 'rgb(...)' */) => {
            let colorVals = util.colorValues(color);
            let blackDist = (0 - colorVals[0]) ** 2 + (0 - colorVals[1]) ** 2 + (0 - colorVals[2]) ** 2;
            let whiteDist = (255 - colorVals[0]) ** 2 + (255 - colorVals[1]) ** 2 + (255 - colorVals[2]) ** 2;
            let iconColor = whiteDist >= blackDist ? 'white' : 'black';
            document.documentElement.style.setProperty('--color-edit-icon-color', iconColor);
        };
        updateColorIconColor(colorEdit.style.color);

        colorEdit.appendChild(colorInput);
        colorEdit.appendChild(clrPicker);
        editRootNode.appendChild(colorEdit);

        let that = this;
        colorInput.onchange = function () {
            // Set color swatch settings once color menu has been exited
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

            updateColorIconColor(colorEdit.style.color);
        };
        colorEdit.style.color = cardData.color;

        return editRootNode;
    }

    // let id = -1 to unfocus without focusing on another.
    focusCard(id) {
        this.moveCardID = id;

        if (id === this.focusCardID) return;

        // Cleanup the previously focused card
        if (this.focusCardID != -1) {
            let unfocused = getCardTag(this.focusCardID);
            if (!unfocused) {
                this.focusCardID = -1;
                return;
            }

            let editUI = unfocused.getElementsByClassName("actions")[0];
            if (editUI) {
                unfocused.removeChild(editUI);
                let anchors = unfocused.getElementsByClassName("resize-anchor");
                // Copy to array to avoid skipping elements as
                // they are deleted (getElem.. returns a live HTML collection)
                for (let e of Array.from(anchors))
                    unfocused.removeChild(e);
            }
        }

        // Setup the newly focused card
        this.focusCardID = id;
        if (this.focusCardID != -1) {
            let card = this.cardsData.get(id);
            let focused = getCardTag(this.focusCardID);
            focused.appendChild(this.htmlEditUI(id));

            let resizeAnchors = util.resizeAnchors(card.color);
            let drag = -1; // corresponds to resizeAnchors index
            for (let i = 0; i < resizeAnchors.length; i++) {
                let a = resizeAnchors[i];
                focused.appendChild(a);
                a.onmousedown = (e) => { e.stopPropagation(); drag = i; };
            }

            document.addEventListener('mouseup', () => drag = -1);
            document.addEventListener('mousemove', (e) => {
                if (drag == -1) return;

                let style = window.getComputedStyle(focused);
                let prev = util.styleRect(style);
                let rect = focused.getBoundingClientRect();

                let deltaX = (e.pageX - rect.left) / 2;
                let deltaY = (e.pageY - rect.top) / 2;

                let newX = prev.x + deltaX;
                let newY = prev.y + deltaY;
                let newWidth = prev.width - deltaX;
                let newHeight = prev.height - deltaY;

                let minSize = util.minSize(focused);
                // This way works. Simply not setting size when newSize < minSize
                // jolts the card position when the minimum size is reached.
                if (newWidth < minSize.x) { newWidth = prev.width;    newX = prev.x; }
                if (newHeight < minSize.y) { newHeight = prev.height; newY = prev.y; }

                focused.style.minWidth = `${newWidth}px`;
                focused.style.left = `${newX}px`;
                focused.style.minHeight = `${newHeight}px`;
                focused.style.top = `${newY}px`;

            });

            // HACK!
            // Change z-index to top by physically moving DOM location
            // and cardsData map insertion order (for serialization of z-index)
            getCardContainerTag().appendChild(focused);
            let data = card;
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
            if (cardObject.fontSize) {
                p.style.fontSize = cardObject.fontSize;
            }
            p.contentEditable = true;
            p.innerHTML = globalThis.sanitizeHtml(cardObject.text);
            // Re-add sanitised styles
            for (let tag of p.getElementsByTagName('img'))
                tag.classList.add('card-image');

            p.oninput = () => {
                that.updateCardContent(id);
            };

            // To allow content highlighting without card movement
            p.onmousedown = (e) => { e.stopPropagation(); that.focusCard(-1); };

            return p;
        }
    }

    updateCardContent(id) {
        // TODO: undo/redo
        this.cardsData.get(id).text = getCardTag(id).querySelector('p').innerHTML;
    }

    // Add to data, returns id.
    addNewCard(cardObject = new CardObject()) {
        let id = this.cardIds.getNextId();
        this.set(id, cardObject);
        return id;
    }

    // Add prev card from data to HTML.
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
    // pos: should have .x and .y (eg. util Vec2)
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
            this.set(Number(card.id),
                new CardObject(
                    util.vec2(card.x, card.y),
                    card.text,
                    new Set(Array.from(card.connections)),
                    card.color,
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
                "fontSize": card.fontSize,
                "connections": Array.from(card.connections),
                "color": card.color,
            });
        }
        return saveData;
    };
}