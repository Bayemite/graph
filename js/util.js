export class rgb {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

export class cardObject {
    constructor(x, y, t, c, id) {
        this.x = x;
        this.y = y;
        this.title = t;
        this.connection = c
        this.id = id
        this.colour = 0
    }
}

export class vector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

/**
 *  @function lerp
 *  @param {Number} start number
 *  @param {Number} end number
 *  @param {Number} speed multiplier
 */
export function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

/**
 *  @function clamp
 *  @param {Number} bottom clamp bottom
 *  @param {Number} number number
 *  @param {Number} top clamp top
 */
export function clamp(a, x, b) {
    return Math.max(a, Math.min(x, b));
}

export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

export function getById(e) {
    return document.getElementById(e)
}