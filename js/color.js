window.colorSettings = function(input) {
    Coloris({

        // The bound input fields are wrapped in a div that adds a thumbnail showing the current color
        // and a button to open the color picker (for accessibility only). If you wish to keep your
        // fields unaltered, set this to false, in which case you will lose the color thumbnail and
        // the accessible button (not recommended).
        // Note: This only works if you specify a custom selector to bind the picker (option above),
        // it doesn't work on the default [data-coloris] attribute selector.
        // wrap: true,

        // Available themes: default, large, polaroid, pill (horizontal).
        // More themes might be added in the future.
        theme: 'pill',

        // Set the theme to light or dark mode:
        // * light: light mode (default).
        // * dark: dark mode.
        // * auto: automatically enables dark mode when the user prefers a dark color scheme.
        themeMode: 'dark',

        // The margin in pixels between the input fields and the color picker's dialog.
        margin: 2,

        // Set the preferred color string format:
        // * hex: outputs #RRGGBB or #RRGGBBAA (default).
        // * rgb: outputs rgb(R, G, B) or rgba(R, G, B, A).
        // * hsl: outputs hsl(H, S, L) or hsla(H, S, L, A).
        // * auto: guesses the format from the active input field. Defaults to hex if it fails.
        // * mixed: outputs #RRGGBB when alpha is 1; otherwise rgba(R, G, B, A).
        format: 'hex',

        // Set to true to enable format toggle buttons in the color picker dialog.
        // This will also force the format (above) to auto.
        formatToggle: false,

        // Enable or disable alpha support.
        // When disabled, it will strip the alpha value from the existing color value in all formats.
        alpha: true,

        // Set to true to always include the alpha value in the color value even if the opacity is 100%.
        forceAlpha: false,

        // Set to true to hide all the color picker widgets (spectrum, hue, ...) except the swatches.
        swatchesOnly: false,

        // Focus the color value input when the color picker dialog is opened.
        focusInput: true,

        // Select and focus the color value input when the color picker dialog is opened.
        selectInput: false,

        // Show an optional clear button
        clearButton: true,

        // Set the label of the clear button
        clearLabel: 'Clear',

        // An array of the desired color swatches to display. If omitted or the array is empty,
        // the color swatches will be disabled.
        swatches: [
            ...new Set([
            'rgb(51, 153, 255)',
            'rgb(0, 100, 210)',
            'rgb(115, 230, 20)',
            'rgb(0, 204, 136)',
            'rgb(255, 170, 20)',
            ...input
            ])
        ],

        // Set to true to use the color picker as an inline widget. In this mode the color picker is
        // always visible and positioned statically within its container, which is by default the body
        // of the document. Use the "parent" option to set a custom container.
        // Note: In this mode, the best way to get the picked color, is listening to the "coloris:pick"
        // event and reading the value from the event detail (See example in the Events section). The
        // other way is to read the value of the input field with the id "clr-color-value".
        inline: false,

        // In inline mode, this is the default color that is set when the picker is initialized.
        defaultColor: '#000000'
    });
}

window.colorSettings([])

// console.log(window.cardsData)