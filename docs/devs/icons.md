## Icons

WebUI generates a single sprite containing all icons used in the application.

Icon sprite is generated before application is built.\
To include new icons manually while application is running, you can run `yarn icons`.

For icon to be included in the sprite it must be:
- used with `<ix-icon name="myIcon"></ix-icon>`
- or marked with `iconMarker('myIcon')`

### Custom Images
SVGs added to `custom` subdirectory will be included in the sprite.

To add a new icon:
1. Remove styling from the SVG file so that it does not conflict with our application's CSS.
2. Optimize the SVG file using [SVGOMG](https://jakearchibald.github.io/svgomg/).
3. Add the SVG file to the `custom` subdirectory.