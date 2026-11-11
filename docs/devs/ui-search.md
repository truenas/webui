# UI Search

Global search allows user to search for UI elements across TrueNAS.

## How it works

### 1. Mark Elements

Mark elements you want to appear in search using `[ixUiSearch]`.

Search for existing usages to see examples.

Make sure to add synonyms and correct hierarchy.

Put the config in a `.elements.ts` file next to the component's template (see
`power-menu.elements.ts`) and bind it, e.g. `[ixUiSearch]="searchableElements.elements.powerMenu"`.
The main fields of `UiSearchableElement`:

- `hierarchy`: the labels on the path to the element, each wrapped in `T()`.
- `anchorRouterLink`: the route of the page holding the element.
- `anchor`: the id of the element to focus and click. Required where the hierarchy is not given explicitly;
  TypeScript reports it if missing.
- `synonyms`: extra search terms, wrapped in `T()`.
- `requiredRoles`: roles needed to see the result. Can be skipped when the element is already under
  `*ixRequiresRoles`.

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
The trigger is clicked first, then the anchor is focused; see `user-menu.elements.ts` for an example.
When the trigger itself carries `ixUiSearch`, the form it opens can rely on the trigger's generated id, or the
trigger can set a custom `anchor` for the form's `triggerAnchor` to name.

## Elements Outside the Template

`manualRenderElements` force-adds entries to the results for elements the parser can't find in a template.
Each still needs an id it can target on the page; see `services.elements.ts`.

Some elements only appear after a loading indicator resolves. A component can highlight one once it renders by
reading `UiSearchDirectivesService.pendingUiHighlightElement`; see `container-list.component.ts`.

## Advanced Cases

Some elements may not always be visible in the UI if they are being a role check or a feature flag.

In this case, these elements also need to be excluded from search results.\

See `visibleTokens` and `requiredRoles` in `UiSearchableElement`.
