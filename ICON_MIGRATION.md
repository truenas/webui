# Icon Migration Specification

## Overview

Migrate the codebase from `IxIconComponent` to `TnIconComponent` from the `@truenas/ui-components` library.

**Status:** In Progress
**Branch:** `icon-revamp`
**Total Files:** ~208 component files (excluding tests)

## Migration Pattern

### 1. TypeScript Component Files (.ts)

**Before:**
```typescript
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { iconMarker, MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

@Component({
  imports: [IxIconComponent],
})
```

**After:**
```typescript
import { TnIconComponent, tnIconMarker } from '@truenas/ui-components';

@Component({
  imports: [TnIconComponent],
})
```

**IMPORTANT: Use `tnIconMarker()` instead of `iconMarker()`**

When icons are computed dynamically (not hardcoded in templates), use `tnIconMarker()`:

```typescript
// For MDI icons (Material Design Icons)
const icon = tnIconMarker('pencil', 'mdi');  // Returns 'mdi-pencil'

// For TrueNAS custom icons (tn- prefix)
const logo = tnIconMarker('tn-truenas-logo');  // Returns 'tn-truenas-logo'

// Return type is string
getIcon(): string | undefined {
  return tnIconMarker('check-circle', 'mdi');
}
```

**Why tnIconMarker?**
- It applies proper prefixes (mdi-, app-, etc.)
- It marks icons for sprite generation at build time
- It replaces the old `iconMarker()` from ix-icon system

**Important: Update interfaces that accept icons**

When migrating components with icon inputs, update their interfaces/types to accept both:

```typescript
// Before
readonly prefixIcon = input<MarkedIcon>();
interface MyConfig {
  icon?: MarkedIcon;
}

// After
readonly prefixIcon = input<MarkedIcon | string>();
interface MyConfig {
  icon?: MarkedIcon | string;
}
```

This allows compatibility with both old `iconMarker()` and new `tnIconMarker()` during migration.

### 2. Template Files (.html)

**Before:**
```html
<ix-icon name="search"></ix-icon>
<ix-icon name="mdi-close-circle"></ix-icon>
```

**After:**
```html
<tn-icon name="magnify" library="mdi"></tn-icon>
<tn-icon name="close-circle" library="mdi"></tn-icon>
```

**Important Notes:**
- Add `library="mdi"` attribute for Material Design Icons
- Remove `mdi-` prefix from icon names
- Icon name mappings:
  - `search` → `magnify`
  - `visibility` → `eye`
  - `visibility_off` → `eye-off`
  - `mdi-pencil` → `pencil`
  - `mdi-delete` → `delete`
  - `mdi-close-circle` → `close-circle`
  - `mdi-tune` → `tune`
  - `insert_drive_file` → `file` (Material Icons)
  - `folder_open` → `folder-open` (Material Icons, keep semantic meaning!)

**IMPORTANT: Custom TrueNAS Icons (ix- prefix)**
- Keep using `ix-` prefix for custom TrueNAS icons until entire codebase is migrated
- Examples: `ix-dataset`, `ix-dataset-root`, `ix-network-upload-download*`, `ix-layout-*`
- These icons are used across many modules and need coordinated migration
- The sprite scanner validates these are used via `iconMarker('ix-...')` calls

### 3. Test Files (.spec.ts)

**DO NOT import TnIconComponent or TnIconTesting explicitly** - these are configured globally in `setup-jest.ts`.

**Before:**
```typescript
import { TnIconComponent, TnIconTesting } from '@truenas/ui-components';
const createComponent = createComponentFactory({
  imports: [TnIconComponent],
  providers: [TnIconTesting.jest.providers()],
});
```

**After:**
```typescript
// No icon imports needed - handled globally
const createComponent = createComponentFactory({
  component: MyComponent,
  imports: [/* other imports */],
});
```

**Using TnIconHarness:**
```typescript
import { TnIconHarness } from '@truenas/ui-components';

// Use with ancestor selector for specificity
const icon = await loader.getHarness(TnIconHarness.with({ ancestor: '.prefix-icon' }));
expect(await icon.getName()).toBe('pencil'); // No 'mdi-' prefix
```

### 4. Harness Files (.harness.ts)

**Before:**
```typescript
import { MatIconHarness } from '@angular/material/icon/testing';
getIcons = this.locatorForAll(MatIconHarness.with({ ancestor: '.container' }));
```

**After:**
```typescript
import { TnIconHarness } from '@truenas/ui-components';
getIcons = this.locatorForAll(TnIconHarness.with({ ancestor: '.container' }));
```

## Global Test Setup

**File:** `src/setup-jest.ts`

Already configured with:
```typescript
import { TnIconComponent, TnIconTesting } from '@truenas/ui-components';

defineGlobalsInjections({
  imports: [
    IxIconComponent,
    TnIconComponent,  // ✅ Added
    // ...
  ],
  providers: [
    // ...
    TnIconTesting.jest.providers(),  // ✅ Added
  ],
});
```

## Icon Sprite Configuration

**File:** `src/assets/tn-icons/sprite-config.json`

Add new icons as needed. Already added:
- `cancel`, `check`, `close-circle`, `eye`, `eye-off`
- `folder-lock`, `folder-plus`, `magnify`, `minus`
- `pencil`, `star-outline`, `text-search-variant`, `tune`

## Testing Requirements

1. Run tests for changed files: `yarn test:changed`
2. Verify all tests pass before committing
3. Use harnesses (TnIconHarness) for icon assertions - never rely on DOM queries
4. Test icon names match without `mdi-` prefix

## Workflow for Each Module

1. **Identify files:**
   ```bash
   git grep -l "from 'app/modules/ix-icon/ix-icon.component'" | grep "src/app/modules/<module-name>"
   ```

2. **Read all component files** (TypeScript, HTML, tests, harnesses)

3. **Update TypeScript files:**
   - Change import from `IxIconComponent` to `TnIconComponent`
   - Update imports array in component decorator
   - If component has icon inputs/properties, update types from `MarkedIcon` to `MarkedIcon | string`

4. **Update HTML templates:**
   - Change `<ix-icon>` to `<tn-icon>`
   - Add `library="mdi"` attribute
   - Update icon names (remove `mdi-` prefix, apply mappings)

5. **Update test files:**
   - Remove explicit `TnIconComponent` and `TnIconTesting` imports
   - Use `TnIconHarness` for assertions
   - Update expected icon names (remove `mdi-` prefix)

6. **Update harness files (if present):**
   - Change `MatIconHarness` to `TnIconHarness`

7. **Add new icons to sprite-config.json** (if needed)

8. **Run tests:** `yarn test:changed`

9. **Stage and commit:**
   ```bash
   git add <files>
   git commit -m "NAS-000000: Migrate <module-name> from ix-icon to tn-icon"
   ```

## Completed Modules ✅

- [x] `forms` module (46 files)
- [x] `interface-status-icon` (1 file)

## TODO: Quick Wins (1-2 files each)

### Priority 1: Single File Modules

**Note:** Skip components using `[fullSize]` input for now (e.g., `empty` module).

- [ ] `snackbar` (1 file)
  - `src/app/modules/snackbar/`

- [ ] `terminal` (1 file)
  - `src/app/modules/terminal/`

- [ ] `tooltip` (1 file)
  - `src/app/modules/tooltip/`

- [ ] `scheduler` (1 file)
  - `src/app/modules/scheduler/`

- [ ] `ix-tree` (1 file)
  - `src/app/modules/ix-tree/`

- [ ] `slide-ins` (1 file)
  - `src/app/modules/slide-ins/`

### Priority 2: Two File Modules
- [ ] `alerts` (2 files)
  - `src/app/modules/alerts/components/alert/alert.component.ts`
  - `src/app/modules/alerts/components/alerts-panel/alerts-panel.component.ts`

- [ ] `buttons` (2 files)
  - `src/app/modules/buttons/copy-button/copy-button.component.ts`
  - `src/app/modules/buttons/mobile-back-button/mobile-back-button.component.ts`

- [ ] `feedback` (2 files)
  - `src/app/modules/feedback/components/feedback-dialog/feedback-dialog.component.ts`
  - `src/app/modules/feedback/components/similar-issues/similar-issues.component.ts`

- [ ] `jobs` (2 files)
  - `src/app/modules/jobs/`

- [ ] `truenas-connect` (2 files)
  - `src/app/modules/truenas-connect/`

- [ ] `truecommand` (1 file)
  - `src/app/modules/truecommand/`

## TODO: Medium Modules (3-5 files)

- [ ] `global-search` (3 files)
  - `src/app/modules/global-search/components/global-search-results/`
  - `src/app/modules/global-search/components/global-search-trigger/`
  - `src/app/modules/global-search/components/global-search/`

- [ ] `layout` (3 files)
  - `src/app/modules/layout/`

- [ ] `lists` (3 files)
  - `src/app/modules/lists/`

- [ ] `websocket-debug-panel` (5 files)
  - `src/app/modules/websocket-debug-panel/`

## TODO: Larger Modules (6-8 files)

- [ ] `dialog` (6 files) - High impact, commonly used
  - `src/app/modules/dialog/components/error-dialog/`
  - `src/app/modules/dialog/components/general-dialog/`
  - `src/app/modules/dialog/components/info-dialog/`
  - `src/app/modules/dialog/components/job-progress/`
  - `src/app/modules/dialog/components/multi-error-dialog/error-template/`
  - `src/app/modules/dialog/components/subsystem-partially-created-dialog/`

- [ ] `ix-table` (8 files) - Widely used
  - `src/app/modules/ix-table/`

## TODO: Page Modules (Feature Modules)

Defer until all shared modules are complete.

- [ ] `sharing` (30 files)
- [ ] `apps` (19 files)
- [ ] `system` (18 files)
- [ ] `storage` (18 files)
- [ ] `dashboard` (16 files)
- [ ] `datasets` (12 files)
- [ ] `data-protection` (10 files)
- [ ] `credentials` (7 files)
- [ ] `containers` (6 files)
- [ ] `vm` (4 files)
- [ ] `system-tasks` (4 files)
- [ ] `signin` (3 files)
- [ ] `directory-service` (3 files)
- [ ] `services` (2 files)

## Common Issues & Solutions

### Issue: Tests fail with "Cannot read properties of undefined (reading 'Symbol(SIGNAL)')"
**Solution:** TnIconComponent is now configured globally in `setup-jest.ts`. Remove explicit imports from test files.

### Issue: Icons don't render in tests
**Solution:** Ensure TnIconHarness is imported and used with proper ancestor selectors.

### Issue: Icon names don't match expectations
**Solution:** Remove `mdi-` prefix from icon names. Check icon mappings in this document.

### Issue: Harness can't find icons
**Solution:** Update harness to use `TnIconHarness` instead of `MatIconHarness`.

### Issue: Need to add new icon to sprite
**Solution:** Add icon to `src/assets/tn-icons/sprite-config.json` and regenerate sprite with build.

## Progress Tracking

**Completed:** 2 modules (forms, interface-status-icon)
**Remaining Modules:** ~46 modules
**Remaining Page Modules:** ~15 feature areas
**Total Progress:** ~2% complete

## Notes for AI Agents

- Always read ALL related files before making changes (component, template, test, harness)
- Use Glob/Grep tools to find all files in a module before starting
- Run `yarn test:changed` after each module migration
- Commit after each module is complete and tests pass
- Update this document's checkboxes as modules are completed
- Add new icon mappings to this document as they're discovered
- If uncertain about icon names, check existing migrations or sprite-config.json
