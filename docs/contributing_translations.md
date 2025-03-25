# Translating TrueNAS UI

## TL;DR

:point_right: Translate files in `src/assets/i18n` and submit a PR.

## Details

All JSON files for translating TrueNAS UI are located in [src/assets/i18n](https://github.com/truenas/webui/tree/master/src/assets/i18n). \
These files can be edited using your editor of choice or directly on GitHub.

Translation needs to be added to the right part of the string. For example:

```
"1 day": "",
```

becomes

```
"1 day": "1 jour",
```

## Branches

Different branches correspond to different versions of TrueNAS.

To keep things simple, we suggest you make changes to the `master` branch.\
After your PR is merged, changes will appear in the next nightly.

## Tips

- Source files often change, so to avoid conflicts it's better to make multiple smaller PRs instead of trying to translate everything at once.
- CI job will validate your changes and will fail if there are any issues.
- If you want to validate translation strings locally, you need to have Node.js and `yarn` installed, do `yarn install` and execute `yarn validate-translations` in the root of the project.

## Placeholder Tokens

Some strings may contain placeholder tokens in `{curly braces}`.

For example:

```
"Delete {file}?": "",
```

In the UI `{file}` will be replaced with the name of the file, resulting in a string like `"Delete myfile.txt?"`.

You should keep these tokens as is in the translated string, but you can move them around if needed.

```
"Delete {file}?": "Supprimer {file}?",
```

## Plural Forms

Some strings may use [ICU Message Format](https://formatjs.io/docs/core-concepts/icu-syntax/#plural-format) for pluralization.

For example,

```
{n, plural, one {User} other {# users}} deleted
```

may show either `User deleted` or `5 users deleted` depending on the value of `n`.

Everything inside the curly braces is a part of the ICU Message Format.

This particular example can be read as:

1. Look at the value of `n`.
2. If `n` is `one`, print `User`.
3. If `n` is anything else, print `# users`, where `#` is replaced with the value of `n`.
4. Add `deleted` at the end.

## Plural Forms In Different Languages

Different languages have different ways of expressing plural forms.

In English plurality is expressed by changing the form of the noun: `User -> users`.

In Spanish, both noun and verb may change: `Usuario eliminado -> Usuarios eliminados`.

You can express it in the following way:

```
{n, plural, one {Usuario eliminado} other {# usuarios eliminados}}
```

If your language has the same form of the word regadless of whether it's singular or plural, you can just replace the right part with a single form:

```
"({n, plural, =1 {# widget} other {# widgets}})": "({n} 个小部件)",
```

Russian is an example of a language that has even more complicated plural forms. 

In Russian, the word for `user` has three different forms depending on the number of users:

- `1` (one) - `пользователь`
- `2, 3, 4` (few) - `пользователя`
- `5, 6, 7, 8, 9, 0` (other) - `пользователей`

This can be expressed via:

```
{n, plural, =1 {Пользователь удален} few{# пользователя удалено} other {# пользователей удалено}}
```

You would have to research ICU Message Format for your language to find out how to express plural forms.

It's also helpful to test plural strings in an [online editor](http://format-message.github.io/icu-message-format-for-translators/editor.html).

## Contributing Code
By the way, we also welcome code contributions.\
[Learn how to contribute.](https://github.com/truenas/webui/blob/master/docs/contributing_code.md)