# UI Search

Global search allows user to search for UI elements across TrueNAS.

## How it works

### 1. Mark Elements

Mark elements you want to appear in search using `[ixUiSearch]`.

Search for existing usages to see examples.

Make sure to add synonyms and correct hierarchy.

### 2. Extract Searchable Elements

Always run manually:

```bash
yarn extract-ui-search-elements
```

## Clicking Buttons
Let's say you want to add a form to the search.

Most of the time, it's better to target the button and let user press it, rather than trying to open the form directly, when user searches for the form.

However, sometimes you may need to click something (for example to open the menu) to locate the element user is searching for.

See `triggerAnchor` in `UiSearchableElement` for information on how to achieve this.

## Advanced Cases

Some elements may not always be visible in the UI if they are being a role check or a feature flag.

In this case, these elements also need to be excluded from search results.\

See `visibleTokens` and `requiredRoles` in `UiSearchableElement`.
