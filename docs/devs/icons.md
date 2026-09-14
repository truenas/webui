## Icons

WebUI generates a single sprite containing all icons used in the application.

The sprite is generated before the dev server starts and before every build.
To regenerate it manually while the application is running, run `yarn tn-icons`.

For an icon to be included in the sprite it must be:
- used with `<tn-icon name="myIcon"></tn-icon>`
- or marked with `tnIconMarker('myIcon')` for names computed at runtime

### Custom Images
SVGs added to the `src/assets/icons/custom` subdirectory are included in the sprite under an
`app-` prefix (`cloud-off.svg` becomes `app-cloud-off`).

To add a new icon:
1. Remove styling from the SVG file so that it does not conflict with our application's CSS.
2. Optimize the SVG file using [SVGOMG](https://jakearchibald.github.io/svgomg/).
3. Add the SVG file to the `custom` subdirectory.
