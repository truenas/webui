## Icon Sprite

Icon sprite contains all the SVG icons used in the application.

For icon to be included in the sprite it must be:
- used via `<ix-icon name="myIcon"></ix-icon>`
- or marked via `iconMarker('myIcon')`

Icon sprite is built before application is built.\
To include new icons while application is running, you can re-run `yarn icons`.

### Custom Images

Svgs added to `custom` subdirectory will be included in the sprite.

To add a new icon:
1. Remove styling from the SVG file so that it does not conflict without our appllication's CSS.
2. Optimize the SVG file using [SVGOMG](https://jakearchibald.github.io/svgomg/).
3. Add the SVG file to the `custom` subdirectory.