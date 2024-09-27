## Icon Sprite

Icon sprite contains all the SVG icons used in the application.

Icons used in `<ix-icon name=""></ix-icon>` are included automatically.

Icon sprite is built before application is built.

### Custom Images

Any svg added to `custom` subdirectory will be included in the sprite.

When importing SVG asset files please prep the SVG file by removing any styling form the <style> tag or inline style attribute as it conflicts with our application CSS.