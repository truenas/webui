# TrueNAS UI Component Library Integration

This document describes the integration of the `@truenas/ui-components` component library into the TrueNAS WebUI project.

## Installation

The library is published on npm and added to `package.json`:

```json
"@truenas/ui-components": "~0.1.2"
```

## Configuration

### 1. Styles Configuration (angular.json)

Added the theme CSS to the build configuration:

```json
"styles": [
  "node_modules/@bugsplat/angular-tree-component/css/angular-tree-component.css",
  "node_modules/@truenas/ui-components/styles/themes.css",
  "src/assets/styles/index.scss"
]
```

### 2. Theme Compatibility Layer (src/app/modules/theme/theme.service.ts)

Implemented automatic theme synchronization between the webui's theme system and the component library:

```typescript
import { TnThemeService, TnTheme } from '@truenas/ui-components';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private tnThemeService = inject(TnThemeService);

  onThemeChanged(theme: string): void {
    this.activeTheme = theme;
    this.activeTheme$.next(theme);
    const selectedTheme = this.findTheme(this.activeTheme);

    this.setCssVars(selectedTheme);
    this.updateThemeInLocalStorage(selectedTheme);

    // Sync with component library theme (compatibility layer)
    this.syncComponentLibraryTheme(theme);
  }

  private syncComponentLibraryTheme(webuiThemeName: string): void {
    const tnTheme = this.mapWebuiThemeToComponentLibraryTheme(webuiThemeName);
    if (tnTheme) {
      this.tnThemeService.setTheme(tnTheme);
    }
  }

  private mapWebuiThemeToComponentLibraryTheme(webuiThemeName: string): TnTheme | null {
    const themeMap: Record<string, TnTheme> = {
      'ix-dark': TnTheme.Dark,
      'ix-blue': TnTheme.Blue,
      'dracula': TnTheme.Dracula,
      'nord': TnTheme.Nord,
      'paper': TnTheme.Paper,
      'solarized-dark': TnTheme.SolarizedDark,
      'midnight': TnTheme.Midnight,
      'high-contrast': TnTheme.HighContrast,
    };
    return themeMap[webuiThemeName] ?? null;
  }
}
```

**How it works:**
- When the user changes the webui theme (via System Settings), the `ThemeService` automatically updates both:
  1. The webui's CSS variables and styling
  2. The component library's theme via `TnThemeService`
- This ensures components from both systems are always styled consistently
- No manual intervention required - the synchronization is automatic

### 3. Icon Assets Configuration (angular.json)

Configured the build to copy the component library's icon sprite:

```json
"assets": [
  "src/assets",
  "src/sw.js",
  {
    "glob": "**/*",
    "input": "node_modules/@truenas/ui-components/assets/tn-icons",
    "output": "assets/tn-icons"
  }
]
```

This automatically copies the library's icon sprite (`sprite.svg`) and manifest (`sprite-config.json`) to the build output.

## Theme Synchronization

### Available Themes

Both systems support 8 themes with automatic synchronization:

| WebUI Theme Name | Component Library Theme | Description |
|-----------------|------------------------|-------------|
| `ix-dark` | `TnTheme.Dark` | TrueNAS default dark theme |
| `ix-blue` | `TnTheme.Blue` | Official TrueNAS colors on light |
| `dracula` | `TnTheme.Dracula` | Popular Dracula color scheme |
| `nord` | `TnTheme.Nord` | Nord color palette |
| `paper` | `TnTheme.Paper` | FreeNAS 11.2 legacy theme |
| `solarized-dark` | `TnTheme.SolarizedDark` | Solarized dark scheme |
| `midnight` | `TnTheme.Midnight` | Dark theme with blues and greys |
| `high-contrast` | `TnTheme.HighContrast` | High contrast for accessibility |

### How Theme Changes Work

**User changes theme in System Settings:**
1. User selects new theme in webui preferences
2. `ThemeService` receives change from NgRx store
3. `ThemeService.onThemeChanged()` is called
4. WebUI theme CSS variables are updated
5. **Compatibility layer** automatically maps and updates component library theme
6. Both systems are now synchronized

**Result:** Components from both the webui and the component library are consistently styled.

### Transition Period

During the migration to the component library, both theme systems coexist:
- **WebUI themes** (prefixed with `ix-`) control most of the application
- **Component library themes** (prefixed with `tn-`) control library components
- The compatibility layer keeps them in sync automatically
- Eventually, the webui will use the component library's theme system exclusively

## Usage Examples

### Importing Components

```typescript
import { Component } from '@angular/core';
import {
  TnButtonComponent,
  TnCardComponent,
  TnInputComponent,
} from '@truenas/ui-components';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    TnButtonComponent,
    TnCardComponent,
    TnInputComponent,
  ],
  template: `
    <tn-card [title]="'My Card'" [elevation]="'medium'">
      <tn-button
        [label]="'Click Me'"
        [color]="'primary'"
        (onClick)="handleClick()"
      />
    </tn-card>
  `
})
export class ExampleComponent {
  handleClick(): void {
    console.log('Button clicked!');
  }
}
```

## Icon Integration

### Icon System Overview

The component library uses an automatic sprite generation system that includes only the icons you use in your application.

**Two Icon Systems in Parallel:**
- **ix-icon**: WebUI's original icon system (uses `yarn icons` to generate `src/assets/icons/sprite.svg`)
- **tn-icon**: Component library's icon system (uses `yarn tn-icons` to generate `src/assets/tn-icons/sprite.svg`)

Both systems coexist during the migration period.

### Icon Sources

1. **MDI (Material Design Icons)**: 7000+ icons from @mdi/svg
   ```html
   <tn-icon name="folder" library="mdi"></tn-icon>
   ```

2. **Library Custom Icons**: TrueNAS-specific icons (with `tn-` prefix in sprite)
   ```html
   <tn-icon name="dataset" library="custom"></tn-icon>
   <!-- Resolves to tn-dataset in sprite -->
   ```

### Using Icons

**1. Use icons in templates** (automatic detection):

```html
<!-- MDI icons -->
<tn-icon name="folder" library="mdi"></tn-icon>
<tn-icon name="server" library="mdi"></tn-icon>

<!-- Library custom icons (from @truenas/ui-components) -->
<tn-icon name="tn-dataset"></tn-icon>
<tn-icon name="tn-hdd"></tn-icon>

<!-- Your app's custom icons -->
<tn-icon name="my-custom-icon" library="custom"></tn-icon>

<!-- Dynamic icons work too -->
<tn-icon [name]="iconName" library="mdi"></tn-icon>
<tn-icon [name]="isOpen ? 'chevron-down' : 'chevron-right'" library="mdi"></tn-icon>
```

**The sprite generator automatically scans templates** for `<tn-icon>` elements - no marker function needed!

**2. For truly dynamic icons** (runtime-computed, from API, etc.):

When icon names can't be detected from templates (e.g., computed from strings, stored in objects/arrays, or from API responses), use `tnIconMarker()`:

```typescript
import { tnIconMarker } from '@truenas/ui-components';

// Example: Icons determined by runtime logic
const statusIcons = {
  success: tnIconMarker('check-circle', 'mdi'),
  error: tnIconMarker('alert-circle', 'mdi'),
  warning: tnIconMarker('alert', 'mdi'),
};

// Example: Library custom icons
tnIconMarker('tn-dataset');  // TrueNAS-specific icons

// Example: App custom icons
tnIconMarker('my-custom-icon', 'custom');  // Resolves to app-my-custom-icon
```

**Note:** The library uses `tnIconMarker()` (not `iconMarker()`) to avoid conflicts with the webui's existing `ix-icon` system.

**Important:** TrueNAS library icons have the `tn-` prefix (e.g., `tn-dataset`). The `library="custom"` parameter is for **your application's** custom icons, which get prefixed with `app-`.

**3. Generate sprites:**

The webui uses the library's `truenas-icons` CLI tool to generate sprites that include both library icons and consumer-specific icons.

**Configuration File (`truenas-icons.config.js`):**
```javascript
export default {
  srcDirs: [
    './src/app/pages/component-library-demo',
    // Add more directories as components migrate to tn-icon
  ],
  outputDir: './src/assets/tn-icons',
};
```

**Day-to-Day Workflow:**
1. Use `<tn-icon>` elements in templates - they're automatically detected
2. Only use `tnIconMarker()` for truly dynamic icons (runtime-computed names)
3. Sprites are automatically generated before dev server starts and before builds
4. Generated sprites are committed to git (following the same pattern as webui's `ix-icon` sprites)

**Manual Generation:**
```bash
# Generate library icon sprite (scans entire ./src/app directory)
yarn tn-icons

# Automatically runs: truenas-icons generate --src ./src/app --output ./src/assets/tn-icons --url assets/tn-icons
# The --url parameter ensures the sprite URL is correct for Angular's build process (which strips 'src/')
```

**How It Works:**
- **Template scanning**: Automatically detects `<tn-icon>` elements in HTML templates (no marker needed)
- **Marker scanning**: Finds `tnIconMarker()` calls in TypeScript for dynamic icons
- The webui's `ix-icon` system uses `iconMarker()` for namespace separation
- This allows scanning the entire codebase without conflicts between the two icon systems

### Available TrueNAS Custom Icons

The library ships with these TrueNAS-specific icons:
- `dataset`, `dataset-root`
- `hdd`, `hdd-mirror`, `ssd`, `ssd-mirror`
- `truenas-logo`, `truenas-logo-mark`, `truenas-logo-type` (and color variants)
- `truecommand-logo-mark`
- `ha-enabled`, `ha-disabled`, `ha-reconnecting`
- `iscsi-share`, `smb-share`, `nfs-share`, `nvme-share`
- `enclosure`, `replication`, `two-factor-auth`
- And more...

See the full list in: `node_modules/@truenas/ui-components/assets/tn-icons/sprite-config.json`

## Component Library Features

- **Standalone Components**: All components are standalone Angular components
- **Signal-based**: Uses modern Angular signals for reactive state
- **Theming**: Comprehensive theming system with CSS variables
- **Icon System**: Automatic sprite generation with MDI and custom icons
- **Type-safe**: Full TypeScript support with proper types
- **Accessible**: Built with WCAG accessibility standards in mind

## Known Library Gaps

Migration work under epic NAS-141021 turned up several places where
`@truenas/ui-components` had to be worked around.

### Fixed upstream

The four gaps below were fixed in the library and **require
`@truenas/ui-components` >= 0.4.7** (the version this app pins). This app now uses the
library APIs directly and carries no `::ng-deep` workaround for them.

| # | Library gap | Fix | Now used by |
|---|---|---|---|
| 1 | `tn-list-item`'s `[tnListIcon]` / `[tnListAvatar]` / `[tnListItemLine]` / `[tnListItemTrailing]` slots never rendered: the flags gating them were set from a `querySelector` in `ngAfterContentInit`, which cannot see content whose slot has not rendered yet. | Signal `contentChildren` queries | `dual-listbox`, `ordered-list`, `network-configuration-card` |
| 2 | No dense / wrapping `tn-list-item` variant — fixed at 48px rows and single-line ellipsis. | `[dense]` and `[wrap]` inputs | `network-configuration-card` (`[dense]`), `dual-listbox` and `widget-sys-info-active` (`[wrap]`) |
| 3 | No full-width `tn-button`. | `[fullWidth]` input | `ix-oauth-button`, which re-exposes its own `fullWidth` |
| 4 | No full-width `tn-slide-toggle` — `inline-flex`, so it shrink-wraps its label and track. | `[fullWidth]` input | `ordered-list` |

### Still outstanding

| # | Library gap | Current workaround |
|---|---|---|
| 5a | No control over `tn-list-item`'s leading-slot gap. Three consumers reset the library's standard 16px `margin-right` to a different value (`dual-listbox` 5px, `ordered-list` 2px, `network-configuration-card` 0). A `[leadingGap]` input — or having `[dense]` tighten the leading slot too — would remove all three. | `tn-list-item-leading-gap($gap)` |
| 5b | No control over `tn-list-item`'s row metrics beyond `[dense]`. `dual-listbox` needs a 23px row with 12px/16px padding, `inspect-vdevs-dialog` an asymmetric 11px/21px/13px one; neither is expressible, and the host is forced to `padding: 0` by the library, so the padding can only be set on the internal content wrapper. | `tn-list-item-content` |
| 5c | No control over the primary-text span. `dual-listbox` recolours it to `--fg2`; `widget-sys-info` has to make it a flex row to seat a copy button beside the version text (a trailing-slot / rich-label API would cover the latter). | `tn-list-item-primary-text` |
| 6 | No flat / embedded `tn-list` variant. `tn-list` ships a standalone card look (own background, rounded corners, vertical padding), so a list rendered inside an already-bordered container has to flatten it back out. | `ordered-list.component.scss` resets `background` / `border-radius` / `padding` on `tn-list` |
| 7 | `TnMenuHarness` exposes no per-item harness, and so no `getTestId()`. | Menu-item test ids are left unasserted — reaching into the overlay for `.tn-menu-item[data-test]` couples a spec to library-internal markup |
| 8 | No `TnListHarness` / `TnListItemHarness` at all as of 0.4.7, so a spec cannot assert a `tn-list-item` slot rendered without selecting on the library's internal classes. | `dual-listbox.component.spec.ts` queries `.tn-list-item__leading` |

Gaps 5 and 6 are the same signal that produced gaps 1–4: without them, every new
`tn-list-item` consumer adds another `::ng-deep` override.

Because `.tn-list-item__*` is internal markup rather than public API, the three
workarounds under gap 5 live in `src/assets/styles/mixins/tn-list.scss` (alongside the
existing `mixins/tn-card.scss` and `mixins/tn-table.scss`) rather than being spelled out
per consumer. A library class rename is then a one-file fix, and each gap disappears
with a single edit once the corresponding input ships.

That only holds while the mixins are the *only* place the classes are named, so both
linters enforce it rather than leaving it to review:

- `.stylelintrc.json`'s `selector-disallowed-list` bans `.tn-list-item__` selectors in
  every `.scss` file. `mixins/tn-list.scss` carries a `stylelint-disable-next-line` on
  each of its three rules — a per-selector exemption rather than an `overrides` entry,
  because an override would replace the whole disallowed list and a selector banned
  globally later would silently stop being banned inside the mixins.
- `eslint.config.mjs` adds a `no-restricted-syntax` entry matching the string in
  TypeScript, so a spec query or class-name literal can't route around stylelint. Gap 8's
  query in `dual-listbox.component.spec.ts` is the single `eslint-disable-next-line`, and
  goes away with the gap.

A new consumer reaching for `::ng-deep` therefore gets a lint error pointing at the
mixins, and should either use one or, if none fits, add one.

### Local library builds

Unrelated to the gaps above, but useful whenever a library fix has to be tried before
it is published. To run this app against an unreleased library build:

```bash
cd ../truenas-ui-components && yarn build
cd ../webui
rm -rf node_modules/@truenas/ui-components
cp -R ../truenas-ui-components/dist/truenas-ui node_modules/@truenas/ui-components
```

Use a real copy, not a symlink: Jest resolves a symlink to a path outside
`node_modules`, so `transformIgnorePatterns` never applies, the Angular linker never
runs over the partial-Ivy FESM, and every `TestBed` fails with "class doesn't have
@Component decorator". Re-run the copy after any library rebuild — and after any
`yarn install`, which restores the published package.

## Migration follow-ups

Further gaps found while migrating pages to `tn-*` (Epic NAS-141021) — the same class
of thing as "Still outstanding" above — that are deliberately carried rather than fixed
in the migrating PR. Library items belong in
[webui-components](https://github.com/truenas/webui-components); webui items belong on
the epic's follow-up list.

| Gap | Where it shows up | Owner |
| --- | --- | --- |
| No multi-colour status pill primitive | `status-pill` mixin in `src/assets/styles/scss-imports/status-pill.scss`, used by `ix-task-state-cell` and `ix-vmware-status-cell` | library |
| `tn-empty`'s `[title]`/`[description]` are text-only, so an `EmptyConfig.message` written as HTML has to be flattened at runtime | `FlattenEmptyMessagePipe` | library |
| `tn-empty` caps `[description]` at a readable measure but not `[title]`, so a paragraph-length message stretches the full page width | `tn-empty` rule in `src/assets/styles/components/_tn-empty.scss` | library |
| Replication "Enabled" is read-only Yes/No in the detail row when the picker hides the column (it was an interactive toggle before); a dead toggle would be worse, so the toggle stays in the visible column only | `replication-list.component.ts` | webui |

### Adopted from the library

Implemented in `@truenas/ui-components` and used here directly, so these need the
pinned `~0.4.9` (they landed after `0.3.26`, the version this work started against).

| Library addition | What it replaced here |
| --- | --- |
| `tn-table` wraps cells by default (no input) | The `tn-table-fixed-wrap` mixin include on all seven Data Protection lists, and its `::ng-deep` into `.tn-table__cell-content`. Equal-width columns are a separate opt-in, `[fixedLayout]`, which none of these lists needs |
| `tn-table [expandOnRowClick]` | `ExpandOnRowClickDirective` (deleted, with its spec) and its four usages |
| `tn-table [minColumnWidth]` (default `120px`) | Nothing — new. Only applies with `[fixedLayout]`, where it derives a width floor as `minColumnWidth × columnCount` so a narrow viewport scrolls rather than shrinking columns to nothing |

Also fixed in the library and available, but not adopted here because their consumers sit in other
feature areas: `[singleExpand]` (would delete `restrictToSingleExpandedRow`),
`[(sortColumn)]`/`[(sortDirection)]` (would delete `reflectSortIntoTable`), `[emptyDescription]`
(the second empty-state line `dataProviderEmptyState` drops), `TnMenuTriggerDirective`'s
`aria-haspopup`/`aria-expanded` + public `isOpen`, and `tn-side-panel [closeButtonAriaLabel]`.

Two long-standing library bugs surfaced while doing this, both the same root cause — a rule
written as a plain `.tn-table` class selector, which emulated encapsulation compiles to
`[_ngcontent-…]` while the host carries `[_nghost-…]`, so it never matches:
`overflow-x: auto` (horizontal scrolling had never worked on any `tn-table`) and the first
version of `wrapCells`. Both are now `:host`-scoped, with a test guarding the convention.

### Shared pieces for a migrated list page

Built while migrating the Data Protection lists; reach for these rather than
re-deriving them per page.

| Piece | What it replaces |
| --- | --- |
| `tnTableListHost(provider, config)` (`ix-table/utils.ts`) | The `rows`/`isLoading`/`empty`/`displayedColumns`/`hiddenColumns`/`onSortChange`/`columnsChange` block every list otherwise copies, plus `perRow`/`rowTag` memoization keyed to the loaded rows |
| `ExpandOnRowClickDirective` (`ixExpandOnRowClick`) | A `viewChild(TnTableComponent)` and a `(rowClick)` handler calling `toggleRowExpansion` |
| `<ix-table-text-cell>` (`tn-table-cells/text-cell`) | The `<span tnTestIdType="text" [tnTestId]="[…]">` markup for text, yes/no and schedule cells |
| `translated(derive)` (`helpers/translated.helper.ts`) | A `computed` calling `TranslateService.instant()`, which would otherwise freeze on the first locale |
| Global `.sr-only` class (`assets/styles/components/_sr-only.scss`, from the `sr-only` mixin) | A hand-rolled visually-hidden block, or the mixin re-declared per component |
| `translated(() => ({ … }))` column titles | A title literal repeated in the column model, the `tnHeaderCellDef` and the cell's `[title]` (which feeds its test id) |
| `{ name, sortBy }` entries in `displayedColumns` | Losing sorting on a column whose `[tnColumnDef]` name matches no row property |

## Additional Resources

- [npm package](https://www.npmjs.com/package/@truenas/ui-components)
- [GitHub Repository](https://github.com/truenas/webui-components)

## Build Information

The integration is complete and verified:
- ✅ Styles included in build (styles.css: 220.67 kB)
- ✅ Theme compatibility layer implemented
- ✅ Automatic theme synchronization active
- ✅ Icon sprite assets configured and copied
- ✅ Demo component created with icons showcase
- ✅ Build successful with no errors

**Icon Assets Deployed:**
- Sprite SVG: `dist/assets/tn-icons/sprite.svg` (51 KB)
- Sprite manifest: `dist/assets/tn-icons/sprite-config.json`
- 40+ custom TrueNAS icons included

## Technical Details

### Theme Storage

- **WebUI**: Stores theme in `sessionStorage` (key: `theme`) and `localStorage` (key: `theme`)
- **Component Library**: Stores theme in `localStorage` (key: `tn-theme`)
- Both are kept in sync automatically

### CSS Class Application

- **WebUI**: Applies CSS variables to `:root` via JavaScript
- **Component Library**: Applies CSS classes (e.g., `tn-dark`) to `document.documentElement`
- The library's themes are namespaced with `tn-` prefix to avoid conflicts
