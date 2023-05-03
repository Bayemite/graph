const sanitizer = require('sanitize-html');

globalThis.sanitizeHtml = (dirtyHtml) => {
    return sanitizer(
        dirtyHtml,
        {
            allowedTags: sanitizer.defaults.allowedTags.concat([ 'img' ]),
            allowedSchemesByTag: { img: ['data'] }
        }
    );
};