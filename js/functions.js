/**
 *  @function lerp
 *  @param {a} start number
 *  @param {b} end number
 *  @param {t} speed multiplier
 */
function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

/**
 *  @function clamp
 *  @param {Number} bottom clamp number
 *  @param {Number} number number
 *  @param {Number} top multiplier
 */
function clamp(a, x, b) {
    return Math.max(a, Math.min(x, b));
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

class vector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function getById(e) {
    return document.getElementById(e)
}