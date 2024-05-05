import * as util from "./util.js";

export class CardObject {
    constructor(
        pos = util.vec2(),
        size = util.vec2(),
        text = "",
        connectionSet = new Set(),
        color = util.defaultColor,
        fontSize = "initial"
    ) {
        this.pos = pos;
        this.size = size;
        this.text = text;
        this.connections = connectionSet;
        this.color = color;
        this.fontSize = fontSize;
    }

    serialise() {
        let obj = structuredClone(this);
        obj.connections = Array.from(obj.connections);
        return obj;
    }

    static deserialise(obj) {
        let cardObj = new CardObject(...Object.values(obj));
        cardObj.connections = new Set(cardObj.connections);
        return cardObj;
    }
}

function getBreakLinkContainerTag() {
    return document.getElementById("break-link-btns-container");
}

function getCardContainerTag() {
    return document.getElementById('card-container');
}

export function getCardTag(id) {
    return document.getElementById(`card-${id}`);
}

export function getCardContent(id) {
    return getCardTag(id).getElementsByClassName('text')[0];
}

function clearHtmlCards() {
    getCardContainerTag().innerHTML = `<div id="break-link-btns-container"></div>`;
}

function clearHtmlImages() {
    document.getElementById('image-sidebar-content').innerHTML = '';
}

// Create a contrast between border & background colors of card
// Returns {background: "rgba(...)", border: "rgba(...)"}
function borderBackgroundColorPairs(color = util.defaultColor) {
    let components = util.colorValues(color);
    let backgroundColor;
    let borderColor;

    // darken background if dark theme, else darken border
    if (util.getTheme() == "dark") {
        backgroundColor = components.map((c) => c / 4);
        backgroundColor[3] = 1;
        borderColor = components;
    } else {
        backgroundColor = components;
        borderColor = components.map((c) => c / 4);
    }

    backgroundColor = "rgba(" + backgroundColor.join(", ") + ")";
    borderColor = "rgba(" + borderColor.join(", ") + ")";

    return { background: backgroundColor, border: borderColor };
}

export class CardsData {
    // HTML ID notes:
    // - card id: `card-{cardId, from this.cardIds}`
    // - unlink id: `unlink-{fromCardId}_{toCardId}`

    constructor() {
        this.title = "Untitled";

        // id -> CardObject
        this.cardsData = new Map();
        this.cardIds = new util.IDAssign();
        // id -> return val. from addUndoHandler
        this.undoHandler = new Map();

        // id ('image-{id}') -> data: Blob
        this.images = new Map();
        this.imageIds = new util.IDAssign();
        this.currentImgFocus = null;

        this.linkStart = -1;
        this.linkInProgress = false;

        this.moveCardID = -1;
        this.movePointerId = null;
        this.prevMousePos = null;
        this.mouseDownPos = null;
        this.initialBounds = null;

        this.snapAxis = false; // for movement axis locking ('x','y', or false)
        this.snapAlign = false; // snap to nearest card position
        this.snapAlignPos = util.vec2(null, null);

        this.focusCardID = -1;
        // type: str --> func
        this.focusCallbacks = new Map();

        this.cardColors = new Set();

        this.dirty = false;

        this.undoRedoStack = new util.UndoRedoStack();
        this.undoRedoStack.addEventListener('change', (e) => {
            this.#updateUndoRedoBtnDisable();
            if (e.detail.type == 'add') {
                this.dirty = true;
            }
        });
        this.#updateUndoRedoBtnDisable();

        let cardId = this.#addNewCard(
            new CardObject(util.vec2(-100, 150))
        );

        let conn = new Set();
        conn.add(cardId);
        this.#addNewCard(
            new CardObject(
                util.vec2(),
                util.vec2(),
                "Title",
                conn,
                util.defaultColor
            )
        );
    }

    getFocusedCard() {
        return getCardTag(this.focusCardID);
    }

    #updateUndoRedoBtnDisable() {
        if (this.undoRedoStack.hasUndo())
            document.getElementById('undo-button').setAttribute('data-no-action', false);
        else
            document.getElementById('undo-button').setAttribute('data-no-action', true);

        if (this.undoRedoStack.hasRedo())
            document.getElementById('redo-button').setAttribute('data-no-action', false);
        else
            document.getElementById('redo-button').setAttribute('data-no-action', true);
    }

    undo() {
        this.undoRedoStack.undo();
        this.#updateUndoRedoBtnDisable();
    }

    redo() {
        this.undoRedoStack.redo();
        this.#updateUndoRedoBtnDisable();
    }

    #freezeColorUndoCmd() {
        let next = this.undoRedoStack.nextUndo();
        if (next?.type == 'card-color' && next.data.merge == true)
            next.data.merge = false;
    }

    set(key, value) {
        this.cardsData.set(key, value);
    }

    get(key) {
        return this.cardsData.get(key);
    }

    addLink(start, end, updateLink = true) {
        this.get(start).connections.add(end);

        let breakLink = document.createElement("button");
        breakLink.classList.add("break-link-button", 'no-print');
        breakLink.id = `unlink-${start}_${end}`;
        breakLink.innerHTML = `
            <span class="material-symbols-outlined">
                close
            </span>
        `;
        breakLink.onclick = () => this.deleteLink(start, end);

        getBreakLinkContainerTag().appendChild(breakLink);

        if (updateLink)
            window.camera.updateLink(start);
    }

    deleteLink(start, end, addUndo = true) {
        this.get(start).connections.delete(end);

        document.querySelector(`#link-${start}_${end}`).remove();
        document.querySelector(`#unlink-${start}_${end}`).remove();

        if (addUndo)
            this.undoRedoStack.addUndoCmd({
                type: 'delete-link',
                id: `${start}_${end}`,
                undo: () => this.addLink(start, end),
                redo: () => this.deleteLink(start, end, false),
            });
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

        if (this.get(linkEnd) === undefined) {
            console.log(linkEnd + " linkEnd is undefined.");
        }
        // Disallow reconnection
        if (this.get(linkEnd).connections.has(this.linkStart)) {
            this.linkInProgress = false;
            return;
        }

        // Disallow same connection
        if (this.get(this.linkStart).connections.has(linkEnd)) {
            this.linkInProgress = false;
            return;
        }

        // If click on self just ignore
        if (this.linkStart == linkEnd) return;

        this.linkInProgress = false;
        this.addLink(this.linkStart, linkEnd);
        window.camera.updateCanvas();

        if (addUndo) {
            let linkStart = this.linkStart;
            this.undoRedoStack.addUndoCmd({
                type: 'add-link',
                id: `${linkStart}_${linkEnd}`,
                undo: () => this.deleteLink(linkStart, linkEnd, false),
                redo: () => this.addLink(linkStart, linkEnd),
            });
        }
    }

    // For restoration of links to a deleted card on undo
    #linksToCard(id) {
        let links = [];
        for (let [cardId, card] of this.cardsData)
            if (card.connections.has(id))
                links.push(cardId);

        return links;
    }

    // Opp. of deleteCard method
    // linksToCard: array of card ids that link to cardObj.
    restoreCard(id, cardObj, linksToCard) {
        this.set(id, cardObj);
        this.#addCardHTML(id, false, false);

        cardObj.connections.forEach(endId => this.addLink(id, endId));
        linksToCard.forEach(startLinkId => this.addLink(startLinkId, id));

        // In case a card was restored after a theme change
        this.updateColors(id);
    }

    deleteCard(id, addUndo = true) {
        if (this.linkInProgress) return;

        this.focusCard(-1);

        if (addUndo) {
            this.undoRedoStack.addUndoCmd({
                type: 'delete-card',
                id: `${id}`,
                data: { card: this.get(id), links: this.#linksToCard(id) },
                undo: (data) => this.restoreCard(id, data.card, data.links),
                redo: () => this.deleteCard(id, false)
            });
        }

        let connections = this.get(id).connections;
        connections.forEach(endId => { this.deleteLink(id, endId, false); });

        for (let [cardId, card] of this.cardsData)
            if (card.connections.has(id))
                this.deleteLink(cardId, id, false);

        this.cardsData.delete(id);
        getCardTag(id).remove();
    }

    // bounds: .x and .y, optional .width and .height
    updateCardBounds(id, bounds) {
        let cardData = this.get(id);
        cardData.pos.x = bounds.x;
        cardData.pos.y = bounds.y;

        let card = getCardTag(id);
        card.style.left = `${cardData.pos.x}px`;
        card.style.top = `${cardData.pos.y}px`;

        if (bounds.width) {
            cardData.size.x = bounds.width;
            card.style.minWidth = `${bounds.width}px`;
        }
        if (bounds.height) {
            cardData.size.y = bounds.height;
            card.style.minHeight = `${bounds.height}px`;
        }

        window.camera.updateLink(id);
    }

    #getCardMovePos(oldPos, mousePos) {
        let delta = camera.globalCoords(mousePos);
        delta = delta.minus(this.prevMousePos);

        let newPos = oldPos.add(delta);
        this.prevMousePos = camera.globalCoords(mousePos);
        return newPos;
    }

    moveElem(e) {
        if (this.movePointerId != e.pointerId || this.moveCardID == -1)
            return;

        let id = this.moveCardID;
        window.camera.updateLink(id);

        let cardData = this.get(id);
        let cardElem = getCardTag(id);
        let oldPos = util.vec2(cardData.pos.x, cardData.pos.y);

        let newPos = this.#getCardMovePos(oldPos, util.vec2(e.pageX, e.pageY));

        if (this.snapAlign) {
            const max = Number.MAX_SAFE_INTEGER;
            let closestDelta = util.vec2(max, max);

            const refRect = getCardTag(id).getBoundingClientRect();
            const refPos = [ // keep ordering
                util.vec2(refRect.left, refRect.top),
                util.vec2(refRect.left + refRect.width / 2, refRect.top + refRect.height / 2),
                util.vec2(refRect.right, refRect.bottom)
            ];

            // snap to card positions
            for (let iterId of this.cardsData.keys()) {
                if (id == iterId)
                    continue;

                const snapRect = getCardTag(iterId).getBoundingClientRect();
                let snapPos = [ // keep ordering
                    util.vec2(snapRect.left, snapRect.top),
                    util.vec2(snapRect.left + snapRect.width / 2, snapRect.top + snapRect.height / 2),
                    util.vec2(snapRect.right, snapRect.bottom)
                ];

                if ( // Ignore outside of view snaps
                    snapPos[0].x > window.innerWidth || snapPos[0].y > window.innerHeight ||
                    snapPos[2].x < 0 || snapPos[2].y < 0
                )
                    continue;

                for (let index = 0; index < 9; index++) {
                    let i = index % 3;
                    if (index > 0 && i == 0)
                        snapPos.push(snapPos.shift());

                    let snapP = window.camera.globalCoords(snapPos[i]);
                    let refP = window.camera.globalCoords(refPos[i]);

                    let deltaX = Math.abs(refP.x - snapP.x);
                    let deltaY = Math.abs(refP.y - snapP.y);

                    const margin = 2;
                    if (deltaX < margin && deltaX < closestDelta.x) {
                        // (- i * etc): convert snapP to top-left of card coords
                        newPos.x = snapP.x - i * (refRect.width / 2);
                        closestDelta.x = deltaX;
                        this.snapAlignPos.x = snapPos[i].x;
                    }
                    if (deltaY < margin && deltaY < closestDelta.y) {
                        newPos.y = snapP.y - i * (refRect.height / 2);
                        closestDelta.y = deltaY;
                        this.snapAlignPos.y = snapPos[i].y;
                    }
                }
            }
        }

        if (this.snapAxis) {
            // snap to axis
            if (this.snapAxis === 'x')
                newPos.y = oldPos.y;
            else
                newPos.x = oldPos.x;

        }

        cardElem.querySelector('.text').contentEditable = false;
        window.getSelection().removeAllRanges();
        this.updateCardBounds(id, newPos);
    }

    // For use with themes, optional id to update a single card, otherwise all are updated
    updateColors(id) {
        let update = (card, container) => {
            let style = container.style;

            let colors = borderBackgroundColorPairs(card.color);
            style.borderColor = colors.border;
            style.backgroundColor = colors.background;
        };

        if (id) {
            let card = this.get(id);
            let container = getCardTag(id);
            update(card, container);
        }
        else {
            for (let [id, card] of this.cardsData.entries()) {
                let container = getCardTag(id);
                update(card, container);
            }
        }
    }

    setCardColor(id, color) {
        let cardData = this.get(id);
        cardData.color = color;

        let colors = borderBackgroundColorPairs(color);
        let cardTag = getCardTag(id);

        cardTag.style.borderColor = colors.border;
        cardTag.style.backgroundColor = colors.background;

        let anchors = cardTag.getElementsByClassName("resize-anchor");
        for (let a of anchors) a.style.color = colors.border;

        util.updateColorIconColor(color);
    }

    #htmlEditUI(id) {
        let editRootNode = document.createElement("div");
        editRootNode.classList.add("actions");
        editRootNode.classList.add("unselectable");

        let linkElem = document.createElement("button");
        linkElem.innerHTML = `
        <span class="material-symbols-outlined">
            call_split
        </span>
        `;
        linkElem.classList.add("actions-button", "link-button");
        linkElem.onclick = () => {
            this.startLink(id);
        };
        editRootNode.appendChild(linkElem);

        let fontElem = document.createElement("button");
        fontElem.innerHTML = `
        <span class="material-symbols-outlined">
            format_size
        </span>
        `;
        fontElem.classList.add("actions-button", "link-button");
        fontElem.onclick = () => {
            let cardObject = this.get(id);

            let fSize = cardObject.fontSize;
            if (fSize == util.defaultFontSize)
                fSize = '1.3rem';
            else
                fSize = util.defaultFontSize;
            cardObject.fontSize = fSize;
            this.getFocusedCard().querySelector("p").style.fontSize = fSize;
        };
        editRootNode.appendChild(fontElem);

        let clrPicker = document.createElement("span");
        clrPicker.classList.add("color-picker");

        let colorInput = document.createElement("input");
        colorInput.type = "text";
        colorInput.value = util.defaultColor;
        colorInput.autocomplete = false;
        colorInput.name = 'color-input';
        colorInput.spellcheck = false;
        colorInput.setAttribute("data-coloris", true);
        colorInput.onclick = (e) => {
            let cList = document.getElementById('clr-picker').classList;
            let c = 'clr-open';
            if (cList.contains(c)) {
                e.stopPropagation();
                Coloris.close();
            }
            else
                cList.add(c);
        };

        let colorEdit = document.createElement("div");
        colorEdit.classList.add("clr-field");
        colorEdit.style.color = util.defaultColor;
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
        util.updateColorIconColor(colorEdit.style.color);

        colorEdit.appendChild(colorInput);
        colorEdit.appendChild(clrPicker);
        editRootNode.appendChild(colorEdit);

        colorInput.onchange = () => {
            // Set color swatch settings once color menu has been exited
            this.cardColors.add(colorEdit.style.color);
            window.colorSettings(Array.from(this.cardColors));

            this.#freezeColorUndoCmd();
        };

        let cardData = this.get(id);
        colorEdit.style.color = cardData.color;

        colorInput.oninput = () => {
            let oldColor = cardData.color;
            let newColor = colorInput.value;
            this.setCardColor(id, newColor);

            let next = this.undoRedoStack.nextUndo();
            if (next?.type == 'card-color' && next.data.merge) {
                next.data.newColor = newColor;
                this.undoRedoStack.dispatchChange(next);
            }
            else {
                this.undoRedoStack.addUndoCmd({
                    type: 'card-color',
                    id: `${id}`,
                    data: {
                        merge: true,
                        oldColor: oldColor,
                        newColor: newColor
                    },
                    undo: (data) => { this.setCardColor(id, data.oldColor); },
                    redo: (data) => { this.setCardColor(id, data.newColor); }
                });
            }
        };

        editRootNode.appendChild(colorEdit);

        return editRootNode;
    }

    // let id = -1 to unfocus without focusing on another.
    focusCard(id) {
        if (id === this.focusCardID) return;

        // Cleanup the previously focused card
        if (this.focusCardID != -1) {
            for (let [type, callback] of this.focusCallbacks)
                document.removeEventListener(type, callback);

            let card = this.getFocusedCard();
            if (!card) {
                this.focusCardID = -1;
                return;
            }

            let text = card.querySelector('.text');
            text.classList.add("unselectable");
            text.contentEditable = false;

            let editUI = card.getElementsByClassName("actions")[0];
            // Presence of editUI implies all the rest of these focus elemen[lccts are here
            if (editUI) {
                editUI.remove();

                let anchors = card.getElementsByClassName("resize-anchor");
                // Copy to array to avoid skipping elements as
                // they are deleted (getElem.. returns a live HTML collection)
                for (let e of Array.from(anchors)) e.remove();

                // The other buttons should be inside the editUI
                let deleteBtn = card.getElementsByClassName("actions-button")[0];
                deleteBtn.remove();

                this.#freezeColorUndoCmd();
                document.getElementById('clr-picker').classList.remove('clr-open');
            }
        }

        // Setup the newly focused card
        this.focusCardID = id;
        if (this.focusCardID != -1) {
            let cardData = this.get(id);
            let focused = getCardTag(this.focusCardID);
            focused.appendChild(this.#htmlEditUI(id));

            let deleteBtn = document.createElement("button");
            deleteBtn.classList.add("actions-button", "remove-button");
            deleteBtn.innerHTML = `
                <span class="material-symbols-outlined">
                    close
                </span>
            `;
            deleteBtn.style = `
                position: absolute;
                top: 0;
                right: 5px;
            `;
            deleteBtn.onclick = () => this.deleteCard(id);
            focused.appendChild(deleteBtn);

            let resizeAnchors = util.resizeAnchors(cardData.color, focused);
            resizeAnchors.addEventListener('pointerdown', () =>
                this.initialBounds = util.computedStyleRect(focused)
            );
            resizeAnchors.addEventListener('resize', (e) => {
                this.updateCardBounds(id, e.detail.bounds);
            });

            this.focusCallbacks.set('keydown', (e) => {
                if (e.key == 'Control') this.snapAlign = true;
                else if (e.shiftKey && this.moveCardID != -1) {
                    this.snapAxis = 'x';
                    if (e.key == 'X') this.snapAxis = 'x';
                    else if (e.key == 'Y') this.snapAxis = 'y';
                    window.camera.updateCanvas();
                }
                // move card with arrow keys
                else if (document.activeElement.tagName !== 'P') {
                    if (e.key == 'ArrowUp') this.cardsData.get(id).pos.y -= 1;
                    else if (e.key == 'ArrowDown') this.cardsData.get(id).pos.y += 1;
                    else if (e.key == 'ArrowLeft') this.cardsData.get(id).pos.x -= 1;
                    else if (e.key == 'ArrowRight') this.cardsData.get(id).pos.x += 1;

                    this.updateCardBounds(id, this.cardsData.get(id).pos);
                }
            });
            this.focusCallbacks.set('keyup', (e) => {
                if (e.key == 'Control') {
                    this.snapAlign = false;
                    this.snapAlignPos = util.vec2(null, null);

                }
                else if (e.key == 'Shift') this.snapAxis = false;
            });
            this.focusCallbacks.set('pointerup', () => {
                this.snapAxis = false;
                this.snapAlign = false;
                this.snapAlignPos = util.vec2(null, null);
                this.moveCardID = -1;
                this.movePointerId = null;

                let bounds = util.computedStyleRect(focused);
                if (this.initialBounds && !bounds.equals(this.initialBounds)) {
                    this.undoRedoStack.addUndoCmd({
                        type: 'card-bounds',
                        id: `${id}`,
                        data: {
                            newBounds: bounds,
                            oldBounds: this.initialBounds
                        },
                        undo: (data) => {
                            this.updateCardBounds(id, data.oldBounds);
                            this.initialBounds = null;
                        },
                        redo: (data) => {
                            this.updateCardBounds(id, data.newBounds);
                            this.initialBounds = null;
                        }
                    });
                    this.initialBounds = null;
                }
            });
            document.addEventListener('keydown', this.focusCallbacks.get('keydown'));
            document.addEventListener('keyup', this.focusCallbacks.get('keyup'));
            document.addEventListener('pointerup', this.focusCallbacks.get('pointerup'));

            // HACK!
            // Change z-index to top by physically moving DOM location
            // and cardsData map insertion order (for serialization of z-index)
            getCardContainerTag().appendChild(focused);
            let data = cardData;
            this.cardsData.delete(id);
            this.set(id, data);
        }
    }

    // Generate all HTML data for card except for position
    // which is deferred to after appendChild, to align to centre using client bounds.
    #genHTMLCard(id) {
        let cardObject = this.get(id);

        let cardContainer = document.createElement("div");
        cardContainer.id = "card-" + id;

        let style = cardContainer.style;
        cardContainer.classList.add("card");

        let colors = borderBackgroundColorPairs(cardObject.color);
        style.borderColor = colors.border;
        style.backgroundColor = colors.background;

        cardContainer.onpointerdown = e => {
            window.touchHandler.onpointerdown(e);
            if (!window.touchHandler.isPinchZoom()) {
                e.stopPropagation();

                this.moveCardID = id;
                this.movePointerId = e.pointerId;
                this.prevMousePos = camera.globalCoords(util.vec2(e.pageX, e.pageY));
                this.initialBounds = util.computedStyleRect(cardContainer);

                if (this.linkInProgress)
                    this.endLink(id);
                else
                    this.focusCard(id);
            };
        };

        // sectioned into separate inline function
        cardContainer.appendChild(cardHTML(this));

        return cardContainer;

        function cardHTML(that) {
            let p = document.createElement("p");

            p.contentEditable = false;
            p.classList.add("text", "unselectable");

            if (cardObject.fontSize) {
                p.style.fontSize = cardObject.fontSize;
            }
            p.innerHTML = DOMPurify.sanitize(cardObject.text);
            // Re-add sanitised styles
            for (let tag of p.getElementsByTagName("img"))
                tag.classList.add("card-image");

            let undoOpts = {
                onupdate: () => window.camera.updateLink(id),
                id: `card-${id}`
            };
            let undoFuncs = util.addUndoHandler(that.undoRedoStack, p, cardObject, undoOpts);
            that.undoHandler.set(id, undoFuncs);

            let focusText = true;
            p.oninput = () => window.camera.updateLink(id);
            p.onpointerdown = (e) => {
                // To allow content highlighting without card movement
                if (p.contentEditable == 'true')
                    e.stopPropagation();
                that.mouseDownPos = camera.globalCoords(util.vec2(e.pageX, e.pageY));

                if (that.linkInProgress)
                    that.endLink(id);
                else if (that.focusCardID != id) {
                    focusText = false;
                    that.focusCard(id);
                }
            };

            p.onpointerup = (e) => {
                if (that.focusCardID != id)
                    return;

                if (!focusText) {
                    focusText = true;
                    return;
                }

                let point = window.camera.globalCoords(util.vec2(e.pageX, e.pageY));
                if (point.equals(that.mouseDownPos)) {
                    p.contentEditable = true;
                    p.classList.remove('unselectable');
                    p.focus();
                }
            };

            return p;
        }
    }

    // Add to data, returns ID. Helper function.
    #addNewCard(cardObject = new CardObject()) {
        let id = this.cardIds.getNextId();
        this.set(id, cardObject);
        return id;
    }

    // Add prev card from data to HTML.
    #addCardHTML(cardId, adjustOriginCentre = false, addUndo = true) {
        let cardContainer = getCardContainerTag().appendChild(
            this.#genHTMLCard(cardId)
        );

        let cardObject = this.get(cardId);
        if (adjustOriginCentre) {
            let boundRect = cardContainer.getBoundingClientRect();
            cardObject.pos.x -= boundRect.width / 2 / window.camera.zoom;
            cardObject.pos.y -= boundRect.height / 2 / window.camera.zoom;
        }
        cardContainer.style.left = cardObject.pos.x + "px";
        cardContainer.style.top = cardObject.pos.y + "px";
        cardContainer.style.minWidth = cardObject.size.x + "px";
        cardContainer.style.minHeight = cardObject.size.y + "px";

        if (addUndo)
            this.undoRedoStack.addUndoCmd({
                type: 'add-card',
                id: `${cardId}`,
                data: { card: this.get(cardId), links: this.#linksToCard(cardId) },
                undo: () => this.deleteCard(cardId, false),
                redo: (data) => this.restoreCard(cardId, data.card, data.links),
            });
    }

    // Updates all img tags with `image-{id}` class with object url of blob
    // addUndo is currently no-op used to determine whether to set this.dirty
    addImage(id = -1, blob, addUndo = true) {
        if (id === -1)
            id = this.imageIds.getNextId();
        this.images.set(id, blob);

        let className = `image-${id}`;
        let url = URL.createObjectURL(blob);

        let imgDiv = document.createElement('div');
        imgDiv.className = 'img-div';

        let img = document.createElement('img');
        img.className = className;
        img.id = className; // Id for template img in sidebar
        img.src = url;
        imgDiv.appendChild(img);

        imgDiv.onclick = () => {
            let id = this.focusCardID;
            if (id == -1) {
                let b = document.body;
                let pos = util.vec2(b.clientWidth / 2, b.clientHeight / 2);
                pos = window.camera.globalCoords(pos);
                id = this.addDefaultCardHtml(pos, true);
            }

            let text = getCardContent(id);
            let newImg = img.cloneNode();
            newImg.classList.add('card-image');
            text.appendChild(newImg);
        };

        // this.images.delete(id) is deferred to genSave
        // This means deleted images will reappear in palette if there are still references to it
        // TODO: maybe prompt for deleting all instances of the image?
        // stopPropogation so that image is not inserted on delete
        util.addRemoveBtn(imgDiv, (e) => e.stopPropagation());

        let imgRefs = document.getElementsByClassName(className);
        for (let ref of imgRefs)
            ref.src = url;

        let imageContainer = document.getElementById('image-sidebar-content');
        imageContainer.appendChild(imgDiv);

        if (addUndo) {
            this.undoRedoStack.dispatchChange({
                type: 'add-image',
                id: `${id}`,
                data: { blob: blob }
            });
        }

        return new Promise(resolve => img.onload = resolve);
    }

    // returns id of card
    // pos: should have .x and .y (eg. util Vec2)
    // adjustOriginToCenter: pos = centre of card instead of top left
    addDefaultCardHtml(
        pos = util.vec2(),
        adjustOriginCentre = false,
        addUndo = true
    ) {
        let id = this.#addNewCard(new CardObject(pos));
        this.#addCardHTML(id, adjustOriginCentre, addUndo);
        this.updateColors(id);
        return id;
    }

    // Bulk load all data to HTML.
    // Overwrites all existing HTML.
    updateHTML(addUndo = true) {
        clearHtmlCards();
        util.clearLinksContainer();

        for (const [cardId, card] of this.cardsData) {
            this.#addCardHTML(cardId, false, addUndo);

            for (let c of card.connections.values())
                this.addLink(cardId, c, false);
        }

        // Must be after card updates, as img refs in card content are updated here
        clearHtmlImages();

        let loadImgPromises = [];
        for (const [id, blob] of this.images) {
            let loadedPromise = this.addImage(id, blob, addUndo);
            loadImgPromises.push(loadedPromise);
        }

        Promise.all(loadImgPromises).then(() => {
            window.camera.updateLinks();
            window.camera.update();
        });
    }

    loadSave(parsedData) {
        this.title = parsedData.title;
        util.getTitleTag().value = parsedData.title;
        // TODO: prompt to save previous data
        this.undoRedoStack.clear();
        this.cardsData.clear();
        this.images.clear();

        try {
            for (let card of parsedData.cards) {
                this.set(
                    card.id,
                    new CardObject(
                        util.vec2(util.getFloat(card.x), util.getFloat(card.y)),
                        util.vec2(util.getFloat(card.width), util.getFloat(card.height)),
                        card.text,
                        new Set(Array.from(card.connections)),
                        util.getColor(card.color),
                        util.getFontSize(card.fontSize)
                    )
                );
            }
            for (let imgData of parsedData.images)
                this.images.set(imgData.id, new Blob([imgData.bytes], { type: imgData.type }));

        } catch (e) {
            let error = new util.Dialog(
                'Error',
                util.tag('p', `Failed to load save.<br><code>${e}</code>`),
                "OK",
            );
            error.show();
            this.title = "Untitled";
            util.getTitleTag().value = this.title;
        }
    }

    async genSave(removeUnusedImages = true) {
        let saveData = {
            title: this.title,
            images: [],
            cards: [],
        };

        let imgBufPromises = [];
        for (let [id, imgBlob] of this.images) {
            if (removeUnusedImages && document.getElementsByClassName(`image-${id}`).length == 0) {
                // TODO: breadcrumb reminder - this WILL intefere with undo serialisation
                this.images.delete(id);
                continue;
            }

            imgBufPromises.push(
                async function () {
                    let buf = await imgBlob.arrayBuffer();
                    return {
                        id: id,
                        type: imgBlob.type,
                        bytes: new Uint8Array(buf)
                    };
                }()
            );
        }

        for (let [cardId, cardData] of this.cardsData) {
            saveData.cards.push({
                id: cardId,
                x: cardData.pos.x,
                y: cardData.pos.y,
                width: cardData.size.x,
                height: cardData.size.y,
                text: cardData.text,
                fontSize: cardData.fontSize,
                connections: Array.from(cardData.connections),
                color: cardData.color,
            });
        }

        saveData.images = await Promise.all(imgBufPromises);

        return saveData;
    }
}
