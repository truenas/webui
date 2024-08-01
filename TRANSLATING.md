# Translating TrueNAS UI

All JSON files for translating TrueNAS web interface are included in this repository under [src/assets/i18n](https://github.com/truenas/webui/tree/master/src/assets/i18n). \
These can be edited using your editor of choice or directly via the GitHub Web based code editing system.

Translation needs to be added to the right part of the string. For example:

```
"1 day": "",
```

becomes

```
"1 day": "1 jour",
```

### Branches

Different branches correspond to different versions of TrueNAS.

It's easiest to make changes to the `master` branch, which corresponds to the most recent unreleased version of TrueNAS SCALE.

Once changes to `master` are merged, they will appear in next nightly build.

### General Recommendations

- Source files may often change, so it's better to make multiple smaller PRs instead of trying to translate everything at once.
- CI job will validate your changes and will fail if there are any issues.
- If you want to validate translation strings locally, you need to have Node.js and `yarn` installed, do `yarn install` and execute `yarn validate-translations` in the root of the project.

### Placeholder Tokens

Some strings may contain placeholder tokens in `{curly braces}`.

For example:

```
"Delete {file}?": "",
```

In the UI `{file}` will be replaced with the name of the file, resulting in a string like `"Delete file.txt?"`.

You should keep these tokens as is in the translated string, but you can move them around if needed.

```
"Delete {file}?": "Supprimer {file}?",
```

### Plural Forms

Some strings may use [ICU Message Format](https://formatjs.io/docs/core-concepts/icu-syntax/#plural-format) for pluralization.

For example,

```
{n, plural, one {User} other {# users}} deleted
```

may show either `User deleted` or `5 users deleted` depending on the value of `n`.

Everything inside the curly braces is a part of the ICU Message Format.

This particular example can be read as:

1. Look at the value of `n`.
2. If `n` is `1`, print `User`.
3. If `n` is anything else, print `# users`, where `#` is replaced with the value of `n`.
4. Add `deleted` at the end.

#### Translating Plural Forms

Different languages have different ways of expressing plural forms.

In English plurality is expressed by changing the form of the noun: `User -> users`.

In Spanish, both noun and verb may change: `Usuario eliminado -> Usuarios eliminados`.

You can express it in the following way:

```
{n, plural, one {Usuario eliminado} other {# usuarios eliminados}}
```

Russian is an example of a language that has more than just singular and plural form of the word. It has one word for 1 item, another for 2 to 4 items and yet another for 5 items and more: `Пользователь -> пользователя -> пользователей`.

This can be expressed via:

```
{n, plural, =1 {Пользователь удален} few{# пользователя удалено} other {# пользователей удалено}}
```

You would have to research ICU Message Format for your language to find out how to express plural forms.

Plural strings can be tested in an [online editor](http://format-message.github.io/icu-message-format-for-translators/editor.html).
