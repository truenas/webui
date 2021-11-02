![text-security](assets/banner.png)

Cross-browser alternative to [`-webkit-text-security`](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-text-security). Check out demo at [noppa.github.io/text-security.html](https://noppa.github.io/text-security.html).

text-security is a simple set of fonts that only consist of 3 different characters.
Disc (the shape normally used in password fields), circle and square. For example, setting
`font-family: "text-security-disc"` for
an element should then display all the element's characters in a concealed
way, like it was a password field. This is useful if you want to get the benefits of `input[type="password"]`
but also combine that with other element types, like `input[type="tel"]`. In
fact, the project was created for this exact purpose [as an answer to a
StackOverflow
question](https://stackoverflow.com/questions/36935576/how-to-make-input-type-tel-work-as-type-password/36950075#36950075).

The project builds on top of Adobe's similar font projects [Adobe Notdef](https://github.com/adobe-fonts/adobe-notdef/tree/1f1f863b2295543598b69bebe42db3e73fe58353)
and [Adobe Blank 2](https://github.com/adobe-fonts/adobe-blank-2/tree/46dce06a42de9230bd96e0c9dffe9b3d40a7a0de).

## Disclaimer
If you are considering this library to replace a password field with a text
field—perhaps to avoid browsers' autofill behavior—please think twice before
doing so. Browsers might offer enhanced security features for password
fields, like limiting which scripts are allowed to read their values. Opting
to use a text field instead will leave your app out of these protections.
There are also accessibility issues with this solution, see [issue 11](https://github.com/noppa/text-security/issues/11).
This font simply masks text like a password field would and does not further
protect the input. There are legitimate use cases where that's ok (think OTP
fields, SSN inputs, etc.), and then there are use cases where it's just not
worth it.

## Browser support
Tested in recent versions of Chrome (for desktop and mobile), Edge,
Firefox, Safari for iOS and IE 11. Opera Mini is **not** supported, as it
[does not support](https://caniuse.com/#feat=fontface) `@font-face` web fonts.

Chrome and Firefox, which support WOFF2 and
[cmap subtable format 13](https://docs.microsoft.com/en-us/typography/opentype/spec/cmap#format-13-many-to-one-range-mappings), will use the optimized WOFF2 font, which is only **0.8 kb** in size.
Older browsers like IE will automatically load the compatibility fonts
whose names are suffixed "-compat" and weigh about 200 kb.

## Installation
```sh
npm install text-security
```

You can use the fonts by adding this project as a dependency and including
`text-security.css` in your project.

```html
<link href="node_modules/text-security/text-security.css" rel="stylesheet" type="text/css">
```
Alternatively, you can grab the fonts you need (most likely text-security-disc and text-security-disc-compat)
from the releases page and include your own `@font-face` definition in CSS.  
[src/style-template.css](src/style-template.css) should give a pretty good idea how to do that, just
change the font name and source path to match your setup.

## CSS Example
After the font is loaded, making a field behave like password field is easy.
```css
.my-password-field {
  font-family: text-security-disc;
  /* Use -webkit-text-security if the browser supports it */
  -webkit-text-security: disc;
}
```

## Building with custom modifications
This repository contains the build scripts needed for creating these fonts.
If you want to add your own shapes or do other modifications, see [Development.md](Development.md).

## License
The published font is licensed with [SIL Open Font License](https://opensource.org/licenses/OFL-1.1).
This is the only license you need to care about if you are simply using the prebuilt fonts.

All the code in this repository that is used for generating these fonts (Dockerfile, Python & shell scripts etc.)
[are licensed MIT](LICENSE_FOR_BUILDTOOLS.txt).

This project builds on top of Adobe's font projects [Adobe Notdef](https://github.com/adobe-fonts/adobe-notdef/tree/1f1f863b2295543598b69bebe42db3e73fe58353)
and [Adobe Blank 2](https://github.com/adobe-fonts/adobe-blank-2/tree/46dce06a42de9230bd96e0c9dffe9b3d40a7a0de), which are included as submodules.
They are also licensed with SIL.

Also included as submodules are
[ttf2eot](https://github.com/wget/ttf2eot/tree/b732f41f717cb934b44ed1979d2e42b2db15dc26) and
[t1utils](https://github.com/kohler/t1utils/blob/3f1ddda424353f0f926dd28efa47b0ac61556ce8). t1utils has a slightly modified MIT license [here](https://github.com/kohler/t1utils/blob/3f1ddda424353f0f926dd28efa47b0ac61556ce8/LICENSE). ttf2eot is extracted from Chromium project.
