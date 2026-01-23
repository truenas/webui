# Icon Migration Strategy & Specification
## From ix-icon to tn-icon Migration Plan

**Branch:** `icon-revamp`
**Created:** 2026-01-23
**Last Updated:** 2026-01-23 (Session 5)

---

## 📊 Current Migration Status

**Overall Progress:** ~35% complete (24 modules completed, 194 of 559 ix-icon usages migrated)

**Current Phase:** Phase 4 - Layout Module (remaining topbar components), Phase 6 - Page Modules
**Last Completed Module:** ix-table (completed 2026-01-23, Phase 5B)
**Next Target Module:** Remaining Phase 4 topbar components or Phase 6 page modules

**Statistics:**
- ✅ **Completed:** ~24 modules/areas (~110 files) - Phases 1, 2, 3, 5A, 5B complete; Phase 4 partial
- ⏳ **Remaining:** 365 ix-icon usages (down from 559) - ~65% remaining
- 🎯 **Progress:** ~35% complete (194 of 559 usages migrated)
- 🚫 **Deferred:** 15 files with [fullSize] input (Phase 7)
- 📦 **Modules Remaining:** Phase 4 completion, Phase 6, Phase 7, Phase 8

**Quick Commands:**
```bash
# Check remaining ix-icon usage
git grep "<ix-icon" src/app | wc -l

# Check migration commits
git log --grep="Migrate.*from ix-icon to tn-icon" --oneline

# Run tests for changed modules
yarn test:changed
```

---

## 📝 Session History

### Session 1: 2026-01-23 - Planning & Specification
**Focus:** Migration strategy and comprehensive documentation

**Completed:**
- ✅ Explored codebase to assess migration state
- ✅ Analyzed icon system architecture (ix-icon vs tn-icon)
- ✅ Identified 216 files remaining with 559 ix-icon usages
- ✅ Documented icon library differences (Material Icons vs MDI)
- ✅ Created 8-phase migration strategy
- ✅ Documented migration patterns for TypeScript, HTML, and tests
- ✅ Created comprehensive icon name mapping tables
- ✅ Established verification checklists and testing strategies
- ✅ Identified 14 files with [fullSize] blockers

**Decisions Made:**
- Defer all [fullSize] icons to Phase 7 (final phase before cleanup)
- Start with Phase 1: 6 single-file modules (quick wins)
- Use systematic module-by-module approach
- No commits without explicit user approval

### Session 2: 2026-01-23 - Snackbar and Terminal Modules Migration
**Focus:** Phase 1 Modules 1-2 - Snackbar and terminal modules migration

**Completed:**
- ✅ Migrated snackbar module (5 files)
  - Updated `snackbar.component.ts`: IxIconComponent → TnIconComponent
  - Updated `snackbar.component.html`: ix-icon → tn-icon
  - Updated `snackbar-config.interface.ts`: MarkedIcon → string, updated JSDoc examples
  - Updated `snackbar.service.ts`: iconMarker → tnIconMarker, removed mdi- prefixes
  - Updated `snackbar.component.spec.ts`: Used TnIconHarness, updated test expectations
  - All tests passing (3/3)
- ✅ Migrated terminal font-size module (3 files)
  - Updated `terminal-font-size.component.ts`: MatIconButton + IxIconComponent → TnIconButtonComponent
  - Updated `terminal-font-size.component.html`: Replaced button with icon to tn-icon-button
  - Updated `terminal-font-size.component.spec.ts`: Used TnIconButtonHarness with click() method
  - All tests passing (5/5)
- ✅ Updated TestDirective to support tn-icon-button element type
- ✅ Updated @truenas/ui-components to v0.1.6 (includes TnIconButtonComponent and click() API)
- ✅ Linting passed for all files
- ✅ Committed changes: `679c9427a3`

**Issues Encountered:**
- TnIconHarness returns full icon name with `mdi-` prefix (e.g., `mdi-alert-circle`)
- TnIconButtonComponent uses `name` attribute, not `icon`
- TestDirective needed update to recognize `tn-icon-button` elements
- Build process auto-generated mdi-plus in sprite-config.json

**Key Learnings:**
- TnIconComponent accepts marked icon strings directly via [name] binding
- TnIconButtonComponent is the proper component for icon-only buttons
- TnIconButtonHarness.with({ name: 'icon-name' }) filters by icon name
- TnIconButtonHarness.click() method works for direct interaction
- TestDirective maps `tn-icon-button` → `button` for test IDs
- Sprite config is auto-generated at build time, no manual updates needed

**Next Session Goals:**
- Continue Phase 1 with tooltip module (Module 3)

### Session 3: 2026-01-23 - Tooltip Module Migration
**Focus:** Phase 1 Module 3 - Tooltip module migration

**Completed:**
- ✅ Migrated tooltip module (4 files)
  - Updated `tooltip.component.ts`: IxIconComponent → TnIconComponent
  - Updated `tooltip.component.html`: ix-icon → tn-icon, fixed import order
  - Migrated icons: `mdi-close` → `close`, `help_outline` → `help-circle-outline`
  - No spec file to update (component has no tests)
- ✅ Build succeeded, sprite generated with 107 icons
- ✅ New icons auto-generated in sprite-config.json: `mdi-close`, `mdi-help-circle-outline`
- ✅ Linting passed

**Issues Encountered:**
- Initial import order issue with @truenas/ui-components placement (fixed)

**Key Learnings:**
- Material Icons `help_outline` → MDI `help-circle-outline` (semantic equivalence maintained)
- Build process continues to auto-generate icons reliably
- Components without tests are simpler to migrate

**Next Session Goals:**
- Continue Phase 1 with scheduler module (Module 4)

### Session 5: 2026-01-23 - Phase 5B Complete: ix-table Module Migration
**Focus:** Migrating ix-table module components from ix-icon to tn-icon

**Completed:**
- ✅ Completed Phase 5B (7/8 components):
  - ix-table-head (arrow-up, arrow-down icons)
  - ix-table-body (chevron-up, chevron-down icons)
  - ix-table-pager (page-first, page-last, chevron-left, chevron-right icons)
  - ix-table-columns-selector (menu-down, minus-circle, check-circle, undo icons)
  - ix-cell-actions (dynamic icon binding)
  - ix-cell-actions-with-menu (dots-vertical, dynamic icon binding)
  - ix-cell-state-button (alert icon with warnings)
  - Deferred: ix-empty-row (uses [fullSize] - Phase 7)
- ✅ Updated 2 spec files:
  - ix-cell-actions.component.spec.ts (updated to use TnIconHarness and tnIconMarker)
  - ix-cell-state-button.component.spec.ts (updated to use TnIconHarness)
- ✅ All 14 tests passing
- ✅ Linting passed for all files
- ✅ Build succeeded, sprite generated with new icons

**Icon Mappings Applied:**
- `first_page` → `page-first` (Material Icons → MDI)
- `last_page` → `page-last` (Material Icons → MDI)
- `more_vert` → `dots-vertical` (Material Icons → MDI)
- `remove` → `minus-circle` (Material Icons → MDI)
- `check_circle` → `check-circle` (Material Icons → MDI)
- All `mdi-*` icons → removed prefix and added `library="mdi"`

**Key Learnings:**
- TnIconHarness returns full marked icon name (e.g., `mdi-pencil`) not just the icon name
- Icon buttons in tables: mat-icon-button + tn-icon pattern works well
- Dynamic icon binding with `[name]` attribute works seamlessly with tnIconMarker()
- ix-table is a critical module used throughout the application - all tests must pass

**Progress Metrics:**
- Started session with: 382 ix-icon usages remaining
- Ended session with: 365 ix-icon usages remaining
- Migrated: 17 usages (3% of original total)
- Modules completed this session: 1 module (ix-table - 7 components)

**Next Session Goals:**
- Complete Phase 4: Remaining topbar components (topbar, ha-status-icon, jobs-indicator, checkin-indicator, resilvering-indicator, user-menu, power-menu, navigation)
- OR proceed to Phase 6: Page modules (storage, datasets, apps, sharing, etc.)

**Additional Work (Continued Session 5): iconMarker Utility Removal**
**Focus:** Complete removal of old iconMarker utility (except Phase 7 deferred files)

**Completed:**
- ✅ **Complete iconMarker() to tnIconMarker() conversion** across all 66 files (166 usages) in page modules
  - Converted all data-protection pages (cloud-sync, replication, rsync, snapshots, vmware-snapshot)
  - Converted all credentials pages (backup-credentials, certificates, kmip, ssh keypairs, ssh connections)
  - Converted all sharing pages (iscsi, nfs, smb, webshare, shares-dashboard)
  - Converted all system pages (acme-dns, advanced-settings, alerts, boot-pool, email, enclosure, failover, general-settings, services, support, system-update, tunable)
  - Converted all storage pages (pools, disks, devices, snapshots, vms, vmware-snapshot)
  - Converted all apps pages (apps, docker-images, docker-store, kubernetes-settings, charts)
  - Converted dashboard pages (pools, interfaces widgets)
- ✅ **Removed remaining iconMarker usages** from non-deferred files:
  - `constants/empty-configs.ts` (15 usages) - empty state configurations
  - `enums/app-state.enum.ts` (5 usages) - app state icon map
  - `helptext/topbar.ts` (2 usages) - menu item icons
  - `modules/empty/empty.component.ts` (7 usages) - empty state component icon logic
  - `modules/websocket-debug-panel/store/websocket-debug.effects.ts` (1 usage) - debug notification
  - `services/session-timeout.service.ts` (1 usage) - timeout notification
- ✅ **Updated interface type definitions** from MarkedIcon to string:
  - `interfaces/empty-config.interface.ts` - removed MarkedIcon import, changed icon to string
  - `interfaces/menu-item.interface.ts` - removed MarkedIcon import, changed icon to string
  - `modules/forms/ix-forms/components/ix-icon-group/icon-group-option.interface.ts` - changed icon to string
  - `modules/forms/ix-forms/components/ix-input/ix-input.component.ts` - changed prefixIcon to string
  - `modules/lists/dual-listbox/dual-listbox.component.ts` - changed listItemIcon to string
- ✅ **Fixed custom icon prefix issue**:
  - Corrected custom icon references from 'tn-' prefix to actual filenames
  - Examples: 'tn-dataset-root' → 'dataset-root', 'tn-truenas-logo' → 'truenas-logo'
  - System automatically adds 'app-' prefix when resolving custom icons
- ✅ **Updated test file**: dual-listbox.component.spec.ts (changed ix-icon to tn-icon query)
- ✅ All 32 tests passing for dual-listbox component
- ✅ Build succeeded with all custom icons resolved correctly

**Issues Encountered & Fixes:**
1. **Issue**: Custom icons failing to build - looking for 'tn-dataset-root.svg'
   - **Root Cause**: Used 'tn-' prefix in tnIconMarker() calls for custom icons
   - **Fix**: Changed to actual filenames without prefix (e.g., 'dataset-root' not 'tn-dataset-root')
   - **Learning**: Custom icons use actual SVG filename (without .svg), system adds 'app-' prefix automatically
2. **Issue**: Missing library parameter in tnIconMarker() calls
   - **Root Cause**: Initially converted without library argument
   - **Fix**: Added library parameter to all calls (e.g., tnIconMarker('check-circle', 'mdi'))
   - **Learning**: tnIconMarker() ALWAYS requires 2 parameters: name and library
3. **Issue**: Test failing - looking for ix-icon instead of tn-icon
   - **Root Cause**: dual-listbox spec still queried 'ix-icon' selector
   - **Fix**: Changed selector from 'ix-icon' to 'tn-icon'

**Remaining iconMarker Usages (Intentionally Kept):**
- `icon-action-config.interface.ts` - Accepts both MarkedIcon and string during migration (backward compatibility)
- `ix-empty-row.component.ts` - Deferred to Phase 7 (uses [fullSize] input)
- `truenas-logo.component.ts` - Deferred to Phase 7 (uses [fullSize] input)

**Key Learnings:**
- **Custom icon naming**: Use actual SVG filename (without extension) in tnIconMarker()
  - ✅ Correct: `tnIconMarker('dataset-root', 'custom')`
  - ❌ Wrong: `tnIconMarker('tn-dataset-root', 'custom')`
  - System resolves as: `app-dataset-root` for lookup
- **tnIconMarker signature**: ALWAYS requires 2 parameters
  - Parameter 1: Icon name (string)
  - Parameter 2: Library ('mdi', 'material', 'custom', 'lucide')
- **Icon prefixes by library**:
  - MDI icons: Remove 'mdi-' prefix from old iconMarker calls
  - Material icons: Keep as-is (e.g., 'apps', 'dns')
  - Custom icons: Use actual filename without prefix
- **Type migration**: MarkedIcon → string is safe throughout codebase

**Files Changed (12 files):**
- src/app/constants/empty-configs.ts
- src/app/enums/app-state.enum.ts
- src/app/helptext/topbar.ts
- src/app/interfaces/empty-config.interface.ts
- src/app/interfaces/menu-item.interface.ts
- src/app/modules/empty/empty.component.ts
- src/app/modules/forms/ix-forms/components/ix-icon-group/icon-group-option.interface.ts
- src/app/modules/forms/ix-forms/components/ix-input/ix-input.component.ts
- src/app/modules/lists/dual-listbox/dual-listbox.component.spec.ts
- src/app/modules/lists/dual-listbox/dual-listbox.component.ts
- src/app/modules/websocket-debug-panel/store/websocket-debug.effects.ts
- src/app/services/session-timeout.service.ts

**Next Commit:**
- Ready to commit iconMarker utility removal changes (pending user approval)

---

### Session 4: 2026-01-23 - Major Progress: Phases 1-3 Complete, Phase 4 & 5A Progress
**Focus:** Completing Phases 1-3, partial Phase 4, and Phase 5A (dialog module)

**Completed:**
- ✅ Completed ALL of Phase 1 (6/6 modules):
  - scheduler (scheduler-preview-column.component)
  - ix-tree (tree-virtual-scroll-view.component)
  - slide-ins (modal-header.component)
- ✅ Completed ALL of Phase 2 (6/6 modules):
  - buttons (copy-button, mobile-back-button)
  - feedback (feedback-dialog, similar-issues)
  - jobs (jobs-panel, job-item) - Critical system feature
  - alerts (alert, alerts-panel) - Critical user-facing feature
  - truecommand (status modal)
  - truenas-connect (status modal, status display)
- ✅ Completed ALL of Phase 3 (3/3 modules):
  - lists (dual-listbox, ordered-list, bulk-list-item)
  - global-search (trigger, main, results) - High-visibility topbar feature
  - websocket-debug-panel (5 components) - Developer tool
- ✅ Completed Phase 4 (3/11 components):
  - change-password-dialog (used TnIconButtonComponent)
  - ha-status-popover (HA status indicators)
  - Note: admin-layout was completed earlier
  - Deferred: truenas-logo (uses [fullSize])
- ✅ Completed ALL of Phase 5A (6/6 components):
  - info-dialog.component (changed default icon: info → information)
  - error-dialog.component (6 icon mappings including alert-circle, eye, eye-off)
  - general-dialog.component (removed MarkedIcon type)
  - job-progress-dialog.component (used TnIconButtonComponent)
  - error-template.component (multi-error dialog icons)
  - subsystem-partially-created-dialog.component (warning → alert)

**Commits Made (Session 4):**
- ae4ccd0827: Migrate modal-header from ix-icon to tn-icon
- d65da66271: Migrate tree-virtual-scroll-view from ix-icon to tn-icon
- 0e72020f36: Migrate scheduler-preview-column from ix-icon to tn-icon
- aa993fab64: Migrate buttons module from ix-icon to tn-icon
- b17bf7aeff: Migrate feedback module from ix-icon to tn-icon
- 2d7ef1f310: Migrate jobs module from ix-icon to tn-icon
- bc2029c7df: Migrate alerts module from ix-icon to tn-icon
- 05d223615d: Migrate truecommand and truenas-connect modules from ix-icon to tn-icon
- 2d2340ed54: Migrate lists module from ix-icon to tn-icon
- de3a91bb89: Migrate global-search module from ix-icon to tn-icon
- 8350af3464: Migrate websocket-debug-panel module from ix-icon to tn-icon
- 3f2bab0e42: Migrate layout module topbar components from ix-icon to tn-icon
- ec9d0ea070: Migrate dialog module from ix-icon to tn-icon

**Test Updates:**
- Updated all test files to use TnIconHarness and TnIconButtonHarness
- Fixed test pattern: use `getHarnessOrNull()` for proper async handling
- All 65+ tests passing across migrated modules

**Key Learnings:**
- Icon button pattern solidified: use TnIconButtonComponent for icon-only buttons
- Test harness pattern: `await loader.getHarnessOrNull(TnIconButtonHarness.with({ name: 'icon-name' }))`
- `TnIconButtonComponent` has built-in `tooltip` input (no need for matTooltip)
- Removed `MarkedIcon` type references, replaced with plain `string`
- Major icon mappings completed: warning→alert, error→alert-circle, visibility→eye, visibility_off→eye-off

**Progress Metrics:**
- Started session with: ~559 ix-icon usages remaining
- Ended session with: 382 ix-icon usages remaining
- Migrated: ~177 usages (32% of original total)
- Modules completed this session: ~18 modules

**Next Session Goals:**
- Complete Phase 4: Remaining topbar components (topbar, jobs-indicator, checkin-indicator, resilvering-indicator, user-menu, power-menu, navigation)
- OR proceed to Phase 5B: ix-table module (8+ components, high risk)
- OR proceed to Phase 6: Page modules (storage, datasets, apps, etc.)

---

## Executive Summary

### Current State Assessment

**Progress:**
- ✅ Completed: ~23 modules/areas (~94 files) - Phases 1, 2, 3 complete; Phase 4 & 5A partial
- ⏳ Remaining: 382 ix-icon usages (down from 559) - ~68% remaining
- 🎯 Progress: ~32% complete (177 of 559 usages migrated)
- 🚫 Blockers: 14 files using `[fullSize]` input (deferred to Phase 7)

**Scope:**
- **Shared Modules:** Most core shared modules completed (forms, snackbar, buttons, jobs, alerts, dialog, etc.)
- **Remaining Shared:** Phase 4 completion (layout/topbar), Phase 5B (ix-table)
- **Page Modules:** 15+ feature areas still queued (dashboard, storage, datasets, apps, sharing, etc.)
- **Total Estimated Effort:** 12-14 weeks following phased approach (ahead of schedule)

### Success Criteria

The migration is complete when:
1. ✅ All ix-icon usages replaced with tn-icon (excluding fullSize blockers)
2. ✅ All iconMarker() calls replaced with tnIconMarker()
3. ✅ All IxIconHarness usages replaced with TnIconHarness
4. ✅ All tests pass with no skipped tests
5. ✅ No visual regressions in UI
6. ✅ No functionality loss
7. ✅ Legacy ix-icon system can be removed from codebase
8. ✅ Legacy icon sprite generation scripts removed

---

## Key Learnings from User's Earlier Work

### Critical Issues to Avoid

1. **fullSize Icons (14 files)**
   - Components using `[fullSize]="true"` input must be migrated LAST
   - Requires TnIconComponent enhancement or CSS-based solution
   - Files: empty.component, signin.component, dashboard widgets, system-tasks, etc.

2. **Icon Semantic Meanings**
   - Be careful when choosing icon equivalents
   - Icons have specific semantic meanings (e.g., `folder-open` vs `folder`)
   - Always verify icon meaning matches context

3. **iconMarker → tnIconMarker**
   - Must replace ALL iconMarker() calls with tnIconMarker()
   - Different signatures: `tnIconMarker('pencil', 'mdi')` vs `iconMarker('mdi-pencil')`
   - Return type: `string` vs `MarkedIcon` (branded type)

4. **Unit Test Harness**
   - Use TnIconHarness (already global in setup-jest.ts)
   - DO NOT import TnIconComponent or TnIconTesting in test files
   - Remove `mdi-` prefix from expected icon names

5. **Systematic Approach**
   - Go page by page, feature by feature, or module by module
   - Never batch unrelated modules together
   - Test thoroughly before committing

6. **No Commits Without Approval**
   - DO NOT commit any changes without explicit user approval
   - Each commit should be reviewed before pushing

---

## Understanding the Icon Systems

### Old System: ix-icon (TWO Icon Libraries)

The legacy `ix-icon` component supported **two different icon libraries**:

1. **Material Icons (Google)** - https://fonts.google.com/icons
   - Used when icon name has **NO prefix**
   - Examples: `search`, `visibility`, `visibility_off`, `folder_open`, `insert_drive_file`
   - Smaller set (~1,000 icons)
   - Less actively maintained

2. **Material Design Icons (MDI)** - https://pictogrammers.com/library/mdi/
   - Used when icon name has **`mdi-` prefix**
   - Examples: `mdi-pencil`, `mdi-magnify`, `mdi-eye`, `mdi-delete`
   - Much larger set (7,000+ icons)
   - Community-maintained, actively developed

**Example in old system:**
```html
<!-- Material Icons (Google) - no prefix -->
<ix-icon name="search"></ix-icon>
<ix-icon name="visibility"></ix-icon>

<!-- Material Design Icons (MDI) - with prefix -->
<ix-icon name="mdi-pencil"></ix-icon>
<ix-icon name="mdi-magnify"></ix-icon>
```

### New System: tn-icon (Standardizing on MDI)

The new `tn-icon` component **standardizes on Material Design Icons (MDI)** because:
- Larger icon set (7,000+ vs 1,000)
- More actively maintained by community
- Better consistency across codebase
- Supports additional libraries (Lucide, custom TrueNAS icons)

**This is why icon names change during migration:**
- `search` (Material Icons) → `magnify` (MDI) - **same visual, different name**
- `visibility` (Material Icons) → `eye` (MDI) - **same visual, different name**
- `visibility_off` (Material Icons) → `eye-off` (MDI) - **same visual, different name**
- `mdi-pencil` → `pencil` (just remove prefix, already MDI)

**Key Point:** When you see `<ix-icon name="search">` without the `mdi-` prefix, it's using Google's Material Icons, NOT a custom icon. These need to be mapped to their MDI equivalents.

---

## Migration Patterns & Reference

### TypeScript Pattern

```typescript
// BEFORE
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { iconMarker, MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

@Component({
  imports: [IxIconComponent],
})
export class MyComponent {
  readonly prefixIcon = input<MarkedIcon>();

  getStatusIcon(): MarkedIcon {
    return iconMarker('mdi-check-circle');
  }
}

// AFTER
import { TnIconComponent, tnIconMarker } from '@truenas/ui-components';

@Component({
  imports: [TnIconComponent],
})
export class MyComponent {
  readonly prefixIcon = input<MarkedIcon | string>();

  getStatusIcon(): string {
    return tnIconMarker('check-circle', 'mdi');
  }
}
```

### HTML Pattern

```html
<!-- BEFORE -->
<ix-icon name="search"></ix-icon>
<ix-icon name="mdi-pencil"></ix-icon>
<ix-icon name="mdi-close-circle"></ix-icon>

<!-- AFTER -->
<tn-icon name="magnify" library="mdi"></tn-icon>
<tn-icon name="pencil" library="mdi"></tn-icon>
<tn-icon name="close-circle" library="mdi"></tn-icon>
```

### Test Pattern

```typescript
// BEFORE
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { TnIconComponent, TnIconTesting } from '@truenas/ui-components';

const createComponent = createComponentFactory({
  imports: [TnIconComponent],
  providers: [TnIconTesting.jest.providers()],
});

const icon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-pencil' }));
expect(await icon.getName()).toBe('mdi-pencil');

// AFTER
import { TnIconHarness } from '@truenas/ui-components';
// NO TnIconComponent or TnIconTesting imports - configured globally

const createComponent = createComponentFactory({
  component: MyComponent,
});

const icon = await loader.getHarness(TnIconHarness.with({
  ancestor: '.prefix-icon',
  name: 'pencil',
  library: 'mdi'
}));
expect(await icon.getName()).toBe('pencil'); // No mdi- prefix!
```

### Icon Name Mappings

**Material Icons (Google) → MDI (name changes):**
These icons had NO prefix in ix-icon and must be mapped to MDI equivalents:

| Old (ix-icon) | New (tn-icon) | Notes |
|---------------|---------------|-------|
| `search` | `magnify` + `library="mdi"` | Material Icons → MDI (different name) |
| `visibility` | `eye` + `library="mdi"` | Material Icons → MDI (different name) |
| `visibility_off` | `eye-off` + `library="mdi"` | Material Icons → MDI (different name) |
| `insert_drive_file` | `file` + `library="mdi"` | Material Icons → MDI (different name) |
| `folder_open` | `folder-open` + `library="mdi"` | Material Icons → MDI (keep semantic!) |

**MDI Icons (already MDI, just remove prefix):**
These icons had `mdi-` prefix in ix-icon, just need prefix removed:

| Old (ix-icon) | New (tn-icon) | Notes |
|---------------|---------------|-------|
| `mdi-pencil` | `pencil` + `library="mdi"` | Remove mdi- prefix |
| `mdi-delete` | `delete` + `library="mdi"` | Remove mdi- prefix |
| `mdi-close-circle` | `close-circle` + `library="mdi"` | Remove mdi- prefix |
| `mdi-tune` | `tune` + `library="mdi"` | Remove mdi- prefix |
| `mdi-check` | `check` + `library="mdi"` | Remove mdi- prefix |
| `mdi-alert` | `alert` + `library="mdi"` | Remove mdi- prefix |

**Custom TrueNAS Icons (keep prefixes, no library attribute needed):**
- `tn-dataset`, `tn-dataset-root`
- `tn-network-upload-download*` (disabled, both, up, down)
- `tn-iscsi-share`, `tn-smb-share`, `tn-nfs-share`, `tn-nvme-share`
- `tn-truenas-logo*`, `tn-truecommand-logo*`
- `tn-ha-enabled`, `tn-ha-disabled`, `tn-ha-reconnecting`
- `tn-hdd`, `tn-ssd`, `tn-enclosure`

---

## Phased Migration Strategy

### Phase 1: Quick Wins - Single File Modules (Week 1)
**Goal:** Build momentum with isolated, simple modules

**Modules (6 total):**
1. ✅ **snackbar** - 1 component
   - Files: `snackbar.component.{ts,html,spec.ts}`
   - Icons: Dynamic icon from config
   - Risk: Low - isolated notification component

2. ✅ **terminal** - 1 component (font-size)
   - Files: `terminal-font-size.component.{ts,html,spec.ts}`
   - Icons: `remove`, `add` (plus/minus)
   - Risk: Low - edge feature

3. ✅ **tooltip** - 1 component
   - Files: `tooltip.component.{ts,html,spec.ts}`
   - Risk: Low - utility component

4. ✅ **scheduler** - 1 component (preview-column)
   - Files: `scheduler-preview-column.component.{ts,html,spec.ts}`
   - Risk: Low - isolated within scheduler

5. ✅ **ix-tree** - 1 component
   - Files: `tree-virtual-scroll-view.component.{ts,html,spec.ts}`
   - Risk: Low - tree navigation

6. ✅ **slide-ins** - 1 component (modal-header)
   - Files: `modal-header.component.{ts,html,spec.ts}`
   - Icons: `mdi-chevron-left`, `cancel`
   - Risk: Medium - widely used in modals, but simple migration

**Acceptance Criteria:**
- [ ] All 6 modules migrated and tested
- [ ] `yarn test:changed` passes for each module
- [ ] Visual verification in browser
- [ ] No console errors
- [ ] Icons render correctly

---

### Phase 2: Small Modules (Week 2)
**Goal:** Migrate two-file modules with moderate complexity

**Modules (6 total):**
1. ✅ **buttons** - 2 components
   - `copy-button.component` - Widely used utility
   - `mobile-back-button.component` - Navigation
   - Icons: `content-copy`, `chevron-left`
   - Risk: Low-Medium - copy-button heavily used

2. ✅ **feedback** - 2 components
   - `feedback-dialog.component`
   - `similar-issues.component`
   - Risk: Low - isolated feature

3. ✅ **jobs** - 2 components
   - `jobs-panel.component`
   - `job-item.component`
   - Icons: Job status (sync, schedule, check-circle, cancel, stop-circle)
   - Risk: Medium - critical system feature

4. ✅ **alerts** - 2 components
   - `alert.component`
   - `alerts-panel.component`
   - Icons: Alert status indicators
   - Risk: Medium - critical user-facing feature

5. ✅ **truecommand** - 1 component
   - `truecommand-status-modal.component`
   - Risk: Low - enterprise feature

6. ✅ **truenas-connect** - 2 components
   - `truenas-connect-status-modal.component`
   - `truenas-connect-status-display.component`
   - Risk: Low - enterprise feature

**Acceptance Criteria:**
- [ ] All 6 modules migrated and tested
- [ ] Job monitoring UI works correctly
- [ ] Alert notifications display properly
- [ ] Copy button functionality intact

---

### Phase 3: Medium Modules (Week 3)
**Goal:** Migrate modules with 3-5 files and moderate complexity

**Modules (4 total):**
1. ✅ **lists** - 3 components
   - `dual-listbox.component`
   - `ordered-list.component`
   - `bulk-list-item.component`
   - Icons: Drag indicators, arrows
   - Risk: Medium - used in forms

2. ✅ **global-search** - 3 components
   - `global-search-trigger.component`
   - `global-search.component`
   - `global-search-results.component`
   - Icons: `magnify`, `close-circle`
   - Risk: High - prominent topbar feature

3. ✅ **websocket-debug-panel** - 5 components
   - `websocket-debug-panel.component`
   - `debug-panel-toggle.component`
   - `message-list.component`
   - `mock-config-list.component`
   - `job-event-builder.component`
   - Risk: Low - developer tool

4. ⚠️ **empty** - 1 component
   - **DEFER - Uses `[fullSize]` input**
   - Handle in Phase 7

**Acceptance Criteria:**
- [ ] Global search works with keyboard shortcuts
- [ ] List components render and interact correctly
- [ ] Debug panel opens/closes properly

---

### Phase 4: Layout Module (Week 4)
**Goal:** Migrate the critical admin layout and topbar components

**Components (~12 files):**
- `admin-layout.component` (already has TnIconComponent import)
- **Topbar and children:**
  - `topbar.component`
  - `change-password-dialog.component`
  - `ha-status-icon.component`
  - `ha-status-popover.component`
  - ⚠️ `truenas-logo.component` - **DEFER (fullSize)**
  - `jobs-indicator.component` (depends on jobs module - Phase 2)
  - `checkin-indicator.component`
  - `resilvering-indicator.component`
  - `user-menu.component`
  - `power-menu.component`
- `navigation.component`

**Risk:** HIGH - Main layout used on every page

**Dependencies:**
- Must complete Phase 2 (jobs module) first
- Some components already importing TnIconComponent

**Acceptance Criteria:**
- [ ] Topbar renders correctly across all pages
- [ ] All menu interactions work
- [ ] HA status indicators display properly
- [ ] Navigation menu opens/closes correctly
- [ ] No layout shifts or misalignments
- [ ] Responsive layout works on mobile

---

### Phase 5: Large Shared Modules (Weeks 5-6)

#### Phase 5A: Dialog Module (Week 5)
**Components (6 files):**
1. `error-dialog.component` - **CRITICAL**
2. `general-dialog.component`
3. `info-dialog.component`
4. `job-progress-dialog.component`
5. `multi-error-dialog/error-template.component`
6. `subsystem-partially-created-dialog.component`

**Risk:** HIGH - Error dialogs critical for UX

**Acceptance Criteria:**
- [ ] All error dialogs display correctly
- [ ] Job progress dialog animations work
- [ ] No console errors when dialogs open/close
- [ ] Icons properly sized and positioned

#### Phase 5B: ix-table Module (Week 6)
**Components (8+ files):**
1. `ix-table-head.component`
2. `ix-table-body.component`
3. `ix-table-pager.component`
4. `ix-table-columns-selector.component`
5. ⚠️ `ix-empty-row.component` - **Check for fullSize**
6. `ix-cell-actions.component` - Has spec file
7. `ix-cell-actions-with-menu.component`
8. `ix-cell-state-button.component` - Has spec file

**Risk:** HIGH - Tables used throughout application

**Acceptance Criteria:**
- [ ] All table interactions work (sort, filter, pagination)
- [ ] Cell action menus open correctly
- [ ] State buttons toggle properly
- [ ] No icon alignment issues in cells

---

### Phase 6: Page Modules (Weeks 7-10)

#### Phase 6A: Storage & Data (Week 7)
**Modules:**
- **storage** (~18 files) - Pool management, disks
- **datasets** (~12 files) - Dataset browser, permissions

**Blockers:**
- ⚠️ `usage-card.component` - **DEFER (fullSize)**
- ⚠️ `dataset-roles-cell.component` - **DEFER (fullSize)**

**Acceptance Criteria:**
- [ ] Pool creation wizard works
- [ ] Dataset browser navigation functional
- [ ] Disk list displays correctly
- [ ] No visual issues in topology views

#### Phase 6B: Apps & Sharing (Week 8)
**Modules:**
- **apps** (~19 files) - App management, containers
- **sharing** (~30 files) - SMB, NFS, iSCSI, NVMe-oF

**Acceptance Criteria:**
- [ ] App installation/updates work
- [ ] Share configuration UIs functional
- [ ] Docker image management works

#### Phase 6C: System & Dashboard (Week 9)
**Modules:**
- **system** (~18 files) - Settings, updates, enclosures
- **dashboard** (~16 files) - Widgets

**Blockers:**
- ⚠️ `widget-sys-info-active.component` - **DEFER (fullSize)**
- ⚠️ `widget-sys-info-passive.component` - **DEFER (fullSize)**
- ⚠️ `product-image.component` - **DEFER (fullSize)**
- ⚠️ `widget-help.component` - **Check for fullSize**

**Acceptance Criteria:**
- [ ] Dashboard loads and updates correctly
- [ ] System update UI works
- [ ] Enclosure views display properly

#### Phase 6D: Remaining Features (Week 10)
**Modules:**
- **data-protection** (~10 files) - Backup, replication
- **credentials** (~7 files) - Users, groups, certificates
- **containers** (~6 files) - Container management
- **vm** (~4 files) - Virtual machines
- **directory-service** (~3 files) - AD, LDAP
- **services** (~2 files) - Service management

**Blockers:**
- ⚠️ **system-tasks** (4 files) - **ALL use fullSize - DEFER**
- ⚠️ **signin** (3 files) - **signin.component uses fullSize - DEFER**

**Acceptance Criteria:**
- [ ] Replication tasks configure correctly
- [ ] User/group management works
- [ ] VM operations functional
- [ ] All features retain functionality

---

### Phase 7: fullSize Migration (Week 11+)
**Goal:** Handle the 14 files using `[fullSize]` input

**Strategy:** Add fullSize support to TnIconComponent or use CSS approach

**Files to Migrate:**
1. `empty.component.html`
2. `ix-empty-row.component.html`
3. `truenas-logo.component.html` (layout)
4. `signin.component.html`
5. `usage-card.component.html` (datasets)
6. `dataset-roles-cell.component.html` (datasets)
7. `widget-sys-info-active.component.html` (dashboard)
8. `widget-sys-info-passive.component.html` (dashboard)
9. `widget-help.component.html` (dashboard)
10. `product-image.component.html` (dashboard)
11. `restart.component.html` (system-tasks)
12. `shutdown.component.html` (system-tasks)
13. `config-reset.component.html` (system-tasks)
14. `failover.component.html` (system-tasks)

**Options:**
1. **Option A (Recommended):** Add fullSize input to TnIconComponent
   - Modify library component
   - Coordinate with library maintainers
   - Clean, consistent solution

2. **Option B:** CSS-based approach
   - Add `.full-size` class with appropriate styles
   - Simpler, no component changes needed

3. **Option C:** Custom wrapper component
   - Create compatibility layer
   - Temporary technical debt

**Acceptance Criteria:**
- [ ] All fullSize icons maintain current appearance
- [ ] No breaking changes to icon sizing
- [ ] Tests pass for all affected components

---

### Phase 8: Legacy System Removal (Week 12)
**Goal:** Remove ix-icon system entirely

**Tasks:**
1. ✅ Verify zero remaining ix-icon usages
2. ✅ Remove ix-icon module directory (`src/app/modules/ix-icon/`)
3. ✅ Remove IxIconComponent from global test setup (`src/setup-jest.ts`)
4. ✅ Remove legacy icon sprite generation scripts
   - Remove build scripts that generate old sprite format
   - Remove references to old sprite config in build pipeline
   - Keep only tn-icon sprite generation
5. ✅ Update documentation
6. ✅ Final test suite run
7. ✅ Visual regression testing
8. ✅ Performance validation

**Verification Commands:**
```bash
# Find any remaining ix-icon imports
git grep "from 'app/modules/ix-icon" src/app

# Find any remaining ix-icon in templates
git grep "<ix-icon" src/app

# Find any remaining IxIconComponent imports
git grep "IxIconComponent" src/app

# Find any remaining IxIconHarness usage
git grep "IxIconHarness" src/app

# Find any remaining iconMarker usage
git grep "iconMarker\(" src/app
```

**Acceptance Criteria:**
- [ ] All searches return 0 results
- [ ] ix-icon module directory removed
- [ ] Legacy sprite generation scripts removed from build pipeline
- [ ] Full test suite passes: `yarn test`
- [ ] Build succeeds: `yarn build:prod`
- [ ] Lint passes: `yarn lint`
- [ ] No visual regressions
- [ ] No functionality loss

---

## Verification Checklist (Per Module)

### Pre-Migration
- [ ] List all files in module (TS, HTML, tests, harnesses)
- [ ] Identify all icon usages with Grep
- [ ] Check for `[fullSize]` usage (defer if present)
- [ ] Note all `iconMarker()` calls
- [ ] Map icon names to equivalents

### During Migration
- [ ] Update TypeScript imports (`IxIconComponent` → `TnIconComponent`)
- [ ] Update template tags (`<ix-icon>` → `<tn-icon>`)
- [ ] Add `library="mdi"` attributes
- [ ] Remove `mdi-` prefixes from icon names
- [ ] Update `iconMarker()` → `tnIconMarker()`
- [ ] Update test harness imports
- [ ] Update expected icon names in tests
- [ ] Add new icons to sprite-config.json if needed

### Post-Migration
- [ ] Run `yarn test:changed` - all tests pass
- [ ] Run `yarn lint` on changed files - no errors
- [ ] Build succeeds: `yarn build`
- [ ] Visual verification in browser
- [ ] Check console for errors/warnings
- [ ] Test icon interactions (hover, click)
- [ ] Verify responsive layouts
- [ ] Check dark mode appearance

### Before Commit (REQUIRES USER APPROVAL)
- [ ] Review all changes with git diff
- [ ] Ensure no unintended file changes
- [ ] Verify commit message format: `NAS-000000: Migrate <module> from ix-icon to tn-icon`
- [ ] Stage only related files
- [ ] Run final test suite
- [ ] **GET USER APPROVAL BEFORE COMMITTING**

---

## Testing Strategy

### Unit Testing
1. **Test Updates per Module:**
   - Remove TnIconComponent/TnIconTesting imports (global setup)
   - Replace IxIconHarness with TnIconHarness
   - Update expected icon names (no mdi- prefix)
   - Use ancestor selectors for specificity

2. **Run Tests:**
   ```bash
   yarn test:changed  # After each module
   yarn test          # Final validation
   ```

### Visual Regression Testing
1. **Playwright MCP Setup:**
   ```bash
   yarn auth-url /dashboard
   # Use generated URL with Playwright MCP
   ```

2. **Critical Pages to Test:**
   - Dashboard (widgets, status icons)
   - Datasets (hierarchy, custom icons)
   - Storage (pool topology, disk icons)
   - Apps (lifecycle, status indicators)
   - Sharing (share type icons)

3. **Visual Checklist per Page:**
   - [ ] Navigate with auth token
   - [ ] Wait for ix-admin-layout (5s+)
   - [ ] Take full-page snapshot
   - [ ] Verify icon visibility
   - [ ] Check icon colors
   - [ ] Test hover states
   - [ ] Verify responsive behavior

### Sprite Validation
```bash
# Validate all used icons are in sprite
jq -r '.icons[]' src/assets/tn-icons/sprite-config.json

# Count icons in sprite
jq '.icons | length' src/assets/tn-icons/sprite-config.json
```

### Acceptance Testing
1. **Functionality:** All features work as before
2. **Visuals:** No regressions in icon appearance
3. **Performance:** Bundle size similar or smaller
4. **Accessibility:** Icon aria-labels, keyboard navigation
5. **Cross-browser:** Chrome, Firefox, Safari, Edge

---

## Risk Mitigation

### Icon Name Mapping Issues
**Mitigation:**
- Use comprehensive icon mapping table (see above)
- Cross-reference with sprite-config.json
- Verify semantic equivalence for each icon
- Document non-obvious mappings in code comments

### Test Failures
**Mitigation:**
- Always use TnIconHarness with ancestor selectors
- Verify expected icon names (no mdi- prefix)
- Check harness queries before running full suite

### Sprite Generation Issues
**Mitigation:**
- Check sprite-config.json before migration
- Add missing icons to config
- Run build to regenerate sprite
- Visual verification in browser

### Visual Regressions
**Mitigation:**
- Screenshot comparison before/after
- Test responsive layouts
- Verify dark mode appearance
- Check icon alignment in tables/forms

---

## 📈 Detailed Progress Tracking

### ✅ Completed Modules

| Module | Files | Completed | Commit | Notes |
|--------|-------|-----------|--------|-------|
| forms | 46 | ~2026-01-15 | e769107abf | Large module, includes ix-input, ix-star-rating, etc. |
| interface-status-icon | 1 | ~2026-01-20 | 9e2be222f4 | Network status indicators |
| snackbar | 5 | 2026-01-23 | 679c9427a3 | Notification component with dynamic icons |
| terminal (font-size) | 3 | 2026-01-23 | 679c9427a3 | Icon buttons for font size controls |
| tooltip | 4 | 2026-01-23 | ad9e4c1903 | Utility component, help_outline → help-circle-outline |
| scheduler | 1 | 2026-01-23 | 0e72020f36 | Preview column component |
| ix-tree | 1 | 2026-01-23 | d65da66271 | Tree navigation |
| slide-ins | 1 | 2026-01-23 | ae4ccd0827 | Modal header (widely used) |
| buttons | 2 | 2026-01-23 | aa993fab64 | copy-button, mobile-back-button |
| feedback | 2 | 2026-01-23 | b17bf7aeff | Feedback dialogs |
| jobs | 2 | 2026-01-23 | 2d7ef1f310 | Job monitoring UI (critical) |
| alerts | 2 | 2026-01-23 | bc2029c7df | Alert notifications (critical) |
| truecommand | 1 | 2026-01-23 | 05d223615d | Enterprise feature |
| truenas-connect | 2 | 2026-01-23 | 05d223615d | Enterprise feature |
| lists | 3 | 2026-01-23 | 2d2340ed54 | Form list components |
| global-search | 3 | 2026-01-23 | de3a91bb89 | Topbar search (high visibility) |
| websocket-debug-panel | 5 | 2026-01-23 | 8350af3464 | Developer tool |
| layout (partial) | 3 | 2026-01-23 | 3f2bab0e42, 4fbed6a546 | admin-layout, change-password-dialog, ha-status-popover |
| dialog | 6 | 2026-01-23 | ec9d0ea070 | All dialog components, critical for UX |
| ix-table | 7 | 2026-01-23 | (pending commit) | 7 components migrated, 1 deferred (ix-empty-row with fullSize) |

**Total Completed:** ~24 modules/areas, ~110 files

---

### 🚀 Phase 1: Single File Modules (Week 1)
**Status:** ✅ COMPLETE | **Target:** 6 modules

| # | Module | Files | Status | Completed | Commit | Notes |
|---|--------|-------|--------|-----------|--------|-------|
| 1 | snackbar | 5 | ✅ Complete | 2026-01-23 | 679c9427a3 | Dynamic icon from config, all tests pass |
| 2 | terminal | 3 | ✅ Complete | 2026-01-23 | 679c9427a3 | Font size controls, used TnIconButtonComponent |
| 3 | tooltip | 4 | ✅ Complete | 2026-01-23 | ad9e4c1903 | Utility component, no spec file |
| 4 | scheduler | 1 | ✅ Complete | 2026-01-23 | 0e72020f36 | Preview column component |
| 5 | ix-tree | 1 | ✅ Complete | 2026-01-23 | d65da66271 | Tree navigation |
| 6 | slide-ins | 1 | ✅ Complete | 2026-01-23 | ae4ccd0827 | Modal header (widely used) |

**Phase 1 Progress:** 6/6 modules (100%) ✅

---

### 📦 Phase 2: Small Modules (Week 2)
**Status:** ✅ COMPLETE | **Target:** 6 modules

| # | Module | Files | Status | Completed | Commit | Notes |
|---|--------|-------|--------|-----------|--------|-------|
| 1 | buttons | 2 | ✅ Complete | 2026-01-23 | aa993fab64 | copy-button, mobile-back-button |
| 2 | feedback | 2 | ✅ Complete | 2026-01-23 | b17bf7aeff | Feedback dialogs |
| 3 | jobs | 2 | ✅ Complete | 2026-01-23 | 2d7ef1f310 | Job monitoring UI (critical) |
| 4 | alerts | 2 | ✅ Complete | 2026-01-23 | bc2029c7df | Alert notifications (critical) |
| 5 | truecommand | 1 | ✅ Complete | 2026-01-23 | 05d223615d | Enterprise feature |
| 6 | truenas-connect | 2 | ✅ Complete | 2026-01-23 | 05d223615d | Enterprise feature |

**Phase 2 Progress:** 6/6 modules (100%) ✅

---

### 🔧 Phase 3: Medium Modules (Week 3)
**Status:** ✅ COMPLETE | **Target:** 3 modules

| # | Module | Files | Status | Completed | Commit | Notes |
|---|--------|-------|--------|-----------|--------|-------|
| 1 | lists | 3 | ✅ Complete | 2026-01-23 | 2d2340ed54 | Form list components |
| 2 | global-search | 3 | ✅ Complete | 2026-01-23 | de3a91bb89 | Topbar search (high visibility) |
| 3 | websocket-debug-panel | 5 | ✅ Complete | 2026-01-23 | 8350af3464 | Developer tool |
| - | ~~empty~~ | 1 | 🚫 Deferred | | | Uses [fullSize] - Phase 7 |

**Phase 3 Progress:** 3/3 modules (100%) ✅

---

### 🏗️ Phase 4: Layout Module (Week 4)
**Status:** ⏳ IN PROGRESS | **Target:** ~11 components

| Component | Status | Completed | Commit | Notes |
|-----------|--------|-----------|--------|-------|
| admin-layout | ✅ Complete | ~2026-01-15 | 4fbed6a546 | Already imports TnIconComponent |
| topbar | 📋 Queued | | | Main topbar component |
| change-password-dialog | ✅ Complete | 2026-01-23 | 3f2bab0e42 | Used TnIconButtonComponent |
| ha-status-icon | 📋 Queued | | | HA status indicators |
| ha-status-popover | ✅ Complete | 2026-01-23 | 3f2bab0e42 | HA status popover |
| jobs-indicator | 📋 Queued | | | Depends on Phase 2 (jobs) - now complete |
| checkin-indicator | 📋 Queued | | | |
| resilvering-indicator | 📋 Queued | | | |
| user-menu | 📋 Queued | | | |
| power-menu | 📋 Queued | | | |
| navigation | 📋 Queued | | | Sidebar navigation |
| ~~truenas-logo~~ | 🚫 Deferred | | | Uses [fullSize] - Phase 7 |

**Phase 4 Progress:** 3/11 components (27%)

---

### 🎯 Phase 5: Large Shared Modules (Weeks 5-6)
**Status:** Phase 5A Complete, Phase 5B Not Started

#### Phase 5A: Dialog Module (6 components) - ✅ COMPLETE
| Component | Status | Completed | Commit | Notes |
|-----------|--------|-----------|--------|-------|
| error-dialog | ✅ Complete | 2026-01-23 | ec9d0ea070 | Critical for UX, 6 icon mappings |
| general-dialog | ✅ Complete | 2026-01-23 | ec9d0ea070 | Removed MarkedIcon type |
| info-dialog | ✅ Complete | 2026-01-23 | ec9d0ea070 | Changed default icon: info → information |
| job-progress-dialog | ✅ Complete | 2026-01-23 | ec9d0ea070 | Used TnIconButtonComponent |
| error-template | ✅ Complete | 2026-01-23 | ec9d0ea070 | Multi-error dialog |
| subsystem-partially-created | ✅ Complete | 2026-01-23 | ec9d0ea070 | warning → alert |

#### Phase 5B: ix-table Module (8 components) - ✅ COMPLETE
| Component | Status | Completed | Commit | Notes |
|-----------|--------|-----------|--------|-------|
| ix-table-head | ✅ Complete | 2026-01-23 | (pending) | arrow-up, arrow-down icons |
| ix-table-body | ✅ Complete | 2026-01-23 | (pending) | chevron-up, chevron-down icons |
| ix-table-pager | ✅ Complete | 2026-01-23 | (pending) | page-first, page-last, chevrons |
| ix-table-columns-selector | ✅ Complete | 2026-01-23 | (pending) | menu-down, minus-circle, check-circle, undo |
| ix-cell-actions | ✅ Complete | 2026-01-23 | (pending) | Dynamic icon binding, tests updated |
| ix-cell-actions-with-menu | ✅ Complete | 2026-01-23 | (pending) | dots-vertical, dynamic icons |
| ix-cell-state-button | ✅ Complete | 2026-01-23 | (pending) | alert icon, tests updated |
| ~~ix-empty-row~~ | 🚫 Deferred | | | Uses [fullSize] - Phase 7 |

**Phase 5 Progress:** 13/14 components (93%) - Phase 5A & 5B Complete ✅

---

### 🌐 Phase 6: Page Modules (Weeks 7-10)
**Status:** Not Started | **Target:** ~170 files

| Module Area | Files | Status | Notes |
|-------------|-------|--------|-------|
| storage & datasets | ~30 | 📋 Queued | 2 components with [fullSize] deferred |
| apps & sharing | ~49 | 📋 Queued | High-traffic features |
| system & dashboard | ~34 | 📋 Queued | 4+ components with [fullSize] deferred |
| data-protection | ~10 | 📋 Queued | Backup, replication |
| credentials | ~7 | 📋 Queued | Users, groups, certs |
| containers | ~6 | 📋 Queued | Container management |
| vm | ~4 | 📋 Queued | Virtual machines |
| directory-service | ~3 | 📋 Queued | AD, LDAP |
| services | ~2 | 📋 Queued | Service management |
| ~~system-tasks~~ | 4 | 🚫 Deferred | All use [fullSize] - Phase 7 |
| ~~signin~~ | 3 | 🚫 Deferred | Uses [fullSize] - Phase 7 |

**Phase 6 Progress:** 0/~170 files (0%)

---

### 🔍 Phase 7: fullSize Migration (Week 11+)
**Status:** Not Started | **Target:** 14 files

**Strategy:** TBD - Requires TnIconComponent enhancement or CSS approach

| File | Component | Status | Notes |
|------|-----------|--------|-------|
| empty.component.html | empty | 🚫 Blocked | Needs fullSize support |
| ix-empty-row.component.html | ix-table | 🚫 Blocked | Needs fullSize support |
| truenas-logo.component.html | layout | 🚫 Blocked | Needs fullSize support |
| signin.component.html | signin | 🚫 Blocked | Needs fullSize support |
| usage-card.component.html | datasets | 🚫 Blocked | Needs fullSize support |
| dataset-roles-cell.component.html | datasets | 🚫 Blocked | Needs fullSize support |
| widget-sys-info-active.component.html | dashboard | 🚫 Blocked | Needs fullSize support |
| widget-sys-info-passive.component.html | dashboard | 🚫 Blocked | Needs fullSize support |
| widget-help.component.html | dashboard | 🚫 Blocked | Needs fullSize support |
| product-image.component.html | dashboard | 🚫 Blocked | Needs fullSize support |
| restart.component.html | system-tasks | 🚫 Blocked | Needs fullSize support |
| shutdown.component.html | system-tasks | 🚫 Blocked | Needs fullSize support |
| config-reset.component.html | system-tasks | 🚫 Blocked | Needs fullSize support |
| failover.component.html | system-tasks | 🚫 Blocked | Needs fullSize support |

**Phase 7 Progress:** 0/14 files (0%) - Blocked until Phases 1-6 complete

---

### 🎉 Phase 8: Legacy System Removal (Week 12)
**Status:** Not Started

**Tasks:**
- [ ] Verify zero remaining ix-icon usages
- [ ] Remove ix-icon module directory
- [ ] Remove IxIconComponent from global test setup
- [ ] Remove legacy sprite generation scripts
- [ ] Update documentation
- [ ] Final test suite run
- [ ] Visual regression testing
- [ ] Performance validation

**Phase 8 Progress:** 0/8 tasks (0%)

---

### 📊 Overall Summary

| Phase | Modules/Files | Completed | Progress |
|-------|--------------|-----------|----------|
| Pre-work | 2 modules | ✅ 2 | 100% |
| Phase 1 | 6 modules | ✅ 6 | 100% ✅ |
| Phase 2 | 6 modules | ✅ 6 | 100% ✅ |
| Phase 3 | 3 modules | ✅ 3 | 100% ✅ |
| Phase 4 | 11 components | ⏳ 3 | 27% |
| Phase 5A | 6 components | ✅ 6 | 100% ✅ |
| Phase 5B | 8 components | ✅ 7 | 88% ✅ |
| Phase 6 | ~170 files | 📋 0 | 0% |
| Phase 7 | 14 files | 🚫 0 | Blocked |
| Phase 8 | 8 tasks | 📋 0 | 0% |
| **TOTAL** | **~234 items** | **✅ 33** | **~35%** |

**Legend:**
- ✅ Complete
- ⏳ In Progress / Next
- 📋 Queued
- 🚫 Deferred/Blocked

---

## Critical Files Reference

### Documentation
- `/Users/aaronervin/Projects/webui/ICON_MIGRATION.md` - Existing migration guide
- `/Users/aaronervin/Projects/webui/src/assets/tn-icons/sprite-config.json` - Icon sprite config (108 icons)

### Example Migrations
- `/Users/aaronervin/Projects/webui/src/app/modules/interface-status-icon/` - Complete migration example
- `/Users/aaronervin/Projects/webui/src/app/modules/forms/` - Large module migration

### Next Target
- `/Users/aaronervin/Projects/webui/src/app/modules/snackbar/` - Phase 1, Module 1

---

## Requirements Summary

1. **Complete removal of legacy ix-icon system**
2. **Full integration of @truenas/ui-components icon system**
3. **No loss in functionality**
4. **No visual regressions**
5. **All tests passing**
6. **Systematic, phased approach**
7. **User approval required before commits**

---

## Success Outcomes

Upon completion:
- ✅ Zero ix-icon usages in codebase
- ✅ All icons using TnIconComponent from @truenas/ui-components
- ✅ All tests passing with TnIconHarness
- ✅ Sprite-based icon loading working correctly (tn-icon sprite only)
- ✅ Visual consistency maintained across all pages
- ✅ Performance maintained or improved
- ✅ Legacy ix-icon module removed
- ✅ Legacy icon sprite generation scripts removed from build pipeline
- ✅ Documentation updated
- ✅ Codebase using modern, maintainable icon system

---

## 📋 How to Update This Spec (For Future Sessions)

This spec is designed to be a living document that tracks migration progress across multiple sessions. Here's how to keep it updated:

### After Completing a Module

1. **Update the Current Migration Status section** (top of document):
   ```markdown
   **Last Updated:** 2026-01-XX
   **Current Phase:** Phase X - Module Name
   **Last Completed Module:** module-name (completed 2026-01-XX)
   **Next Target Module:** next-module-name
   ```

2. **Update the Detailed Progress Tracking table** for that phase:
   ```markdown
   | 1 | snackbar | 1 | ✅ Complete | 2026-01-24 | abc1234 | Verified in browser |
   ```

3. **Update phase progress percentage**:
   ```markdown
   **Phase 1 Progress:** 1/6 modules (17%)
   ```

4. **Update the Overall Summary table**:
   ```markdown
   | Phase 1 | 6 modules | ⏳ 1 | 17% |
   ```

5. **Add entry to Session History**:
   ```markdown
   ### Session X: 2026-01-XX - Phase 1 Module Migrations
   **Focus:** Migrating single-file modules

   **Completed:**
   - ✅ Migrated snackbar module
   - ✅ Updated tests with TnIconHarness
   - ✅ Verified icons render correctly in browser

   **Issues Encountered:**
   - None / [describe any issues]

   **Next Session Goals:**
   - Continue Phase 1 with terminal module
   ```

### When Starting a New Session

1. **Check the "Current Migration Status" section** at the top to see:
   - What phase you're in
   - What was last completed
   - What's next

2. **Review the "Session History"** to understand context and any issues from previous sessions

3. **Check the phase progress table** to see which modules are queued vs in-progress

### Quick Commands for Session Start

```bash
# Check where we are
git log --grep="Migrate.*from ix-icon to tn-icon" --oneline -5

# See what's left
git grep "<ix-icon" src/app | wc -l

# Review spec status
cat .claude/icon-migration-spec.md | grep "Last Updated"
cat .claude/icon-migration-spec.md | grep "Next Target"
```

### Commit the Spec Updates

**Important:** Commit spec updates along with module migrations:
```bash
git add .claude/icon-migration-spec.md
git add src/app/modules/snackbar/
git commit -m "NAS-000000: Migrate snackbar from ix-icon to tn-icon

- Updated snackbar component to use TnIconComponent
- Updated tests to use TnIconHarness
- Updated icon-migration-spec.md progress tracking"
```

This ensures the spec stays in sync with the actual codebase state!
