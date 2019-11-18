# rollup-plugin-uglify [![Travis Build Status][travis-img]][travis]

[travis-img]: https://travis-ci.org/TrySound/rollup-plugin-uglify.svg
[travis]: https://travis-ci.org/TrySound/rollup-plugin-uglify

[Rollup](https://github.com/rollup/rollup) plugin to minify generated bundle.

## Install

```sh
npm i rollup-plugin-uglify -D
```

## Usage

```js
import { rollup } from 'rollup';
import uglify from 'rollup-plugin-uglify';

rollup({
    entry: 'main.js',
    plugins: [
        uglify()
    ]
});
```

## Options

```js
uglify(options, minifier)
```

`options` – default: `{}`, type: `object`. [UglifyJS API options](https://github.com/mishoo/UglifyJS2#api-reference)

`minifier` – default: `require('uglify-es').minify`, type: `function`. Module to use as a minifier. You can use other versions (or forks) of UglifyJS instead default one.

## Examples

### Comments

If you'd like to preserve comments (for licensing for example), then you can specify a function to do this like so:

```js
uglify({
  output: {
    comments: function(node, comment) {
        var text = comment.value;
        var type = comment.type;
        if (type == "comment2") {
            // multiline comment
            return /@preserve|@license|@cc_on/i.test(text);
        }
    }
  }
});
```

Alternatively, you can also choose to keep all comments (e.g. if a licensing header has already been prepended by a previous rollup plugin):

```js
uglify({
  output: {
    comments: 'all'
  }
});
```

See [UglifyJS documentation](https://github.com/mishoo/UglifyJS2#keeping-comments-in-the-output) for further reference.

# License

MIT © [Bogdan Chadkin](mailto:trysound@yandex.ru)
