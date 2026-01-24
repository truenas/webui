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
