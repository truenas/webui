# Icon Migration Strategy & Specification
## From ix-icon to tn-icon Migration Plan

**Branch:** `icon-revamp`
**Created:** 2026-01-23
**Last Updated:** 2026-01-23

---

## 📊 Current Migration Status

**Overall Progress:** ~2% complete (2 of 50+ modules)

**Current Phase:** Planning Complete - Ready for Phase 1
**Last Completed Module:** interface-status-icon (completed before 2026-01-23)
**Next Target Module:** snackbar (Phase 1, Module 1)

**Statistics:**
- ✅ **Completed:** 2 modules (~47 files)
- ⏳ **Remaining:** 216 files with 559 ix-icon usages
- 🚫 **Deferred:** 14 files with [fullSize] input (Phase 7)
- 📦 **Modules Remaining:** 48+ modules across 8 phases

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

**Next Session Goals:**
- Begin Phase 1 with snackbar module migration
- Establish migration workflow and test it on simple module
- Verify all tooling and commands work as expected

---

## Executive Summary

### Current State Assessment

**Progress:**
- ✅ Completed: 2 modules (forms, interface-status-icon) - ~47 files
- ⏳ Remaining: 216 files with 559 ix-icon usages
- 🚫 Blockers: 14 files using `[fullSize]` input (deferred to final phase)

**Scope:**
- **Shared Modules:** 28 modules need migration
- **Page Modules:** 15+ feature areas (dashboard, storage, datasets, apps, sharing, etc.)
- **Total Estimated Effort:** 12-14 weeks following phased approach

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
| forms | 46 | ~2026-01-15 | (before spec) | Large module, includes ix-input, ix-star-rating, etc. |
| interface-status-icon | 1 | ~2026-01-20 | (before spec) | Network status indicators |

**Total Completed:** 2 modules, ~47 files

---

### 🚀 Phase 1: Single File Modules (Week 1)
**Status:** Not Started | **Target:** 6 modules

| # | Module | Files | Status | Completed | Commit | Notes |
|---|--------|-------|--------|-----------|--------|-------|
| 1 | snackbar | 1 | ⏳ Next | | | Dynamic icon from config |
| 2 | terminal | 1 | 📋 Queued | | | Font size controls (minus/add icons) |
| 3 | tooltip | 1 | 📋 Queued | | | Utility component |
| 4 | scheduler | 1 | 📋 Queued | | | Preview column component |
| 5 | ix-tree | 1 | 📋 Queued | | | Tree navigation |
| 6 | slide-ins | 1 | 📋 Queued | | | Modal header (widely used) |

**Phase 1 Progress:** 0/6 modules (0%)

---

### 📦 Phase 2: Small Modules (Week 2)
**Status:** Not Started | **Target:** 6 modules

| # | Module | Files | Status | Completed | Commit | Notes |
|---|--------|-------|--------|-----------|--------|-------|
| 1 | buttons | 2 | 📋 Queued | | | copy-button, mobile-back-button |
| 2 | feedback | 2 | 📋 Queued | | | Feedback dialogs |
| 3 | jobs | 2 | 📋 Queued | | | Job monitoring UI (critical) |
| 4 | alerts | 2 | 📋 Queued | | | Alert notifications (critical) |
| 5 | truecommand | 1 | 📋 Queued | | | Enterprise feature |
| 6 | truenas-connect | 2 | 📋 Queued | | | Enterprise feature |

**Phase 2 Progress:** 0/6 modules (0%)

---

### 🔧 Phase 3: Medium Modules (Week 3)
**Status:** Not Started | **Target:** 3 modules

| # | Module | Files | Status | Completed | Commit | Notes |
|---|--------|-------|--------|-----------|--------|-------|
| 1 | lists | 3 | 📋 Queued | | | Form list components |
| 2 | global-search | 3 | 📋 Queued | | | Topbar search (high visibility) |
| 3 | websocket-debug-panel | 5 | 📋 Queued | | | Developer tool |
| - | ~~empty~~ | 1 | 🚫 Deferred | | | Uses [fullSize] - Phase 7 |

**Phase 3 Progress:** 0/3 modules (0%)

---

### 🏗️ Phase 4: Layout Module (Week 4)
**Status:** Not Started | **Target:** ~11 components

| Component | Status | Completed | Commit | Notes |
|-----------|--------|-----------|--------|-------|
| admin-layout | 📋 Queued | | | Already imports TnIconComponent |
| topbar | 📋 Queued | | | Main topbar component |
| change-password-dialog | 📋 Queued | | | |
| ha-status-icon | 📋 Queued | | | HA status indicators |
| ha-status-popover | 📋 Queued | | | |
| jobs-indicator | 📋 Queued | | | Depends on Phase 2 (jobs) |
| checkin-indicator | 📋 Queued | | | |
| resilvering-indicator | 📋 Queued | | | |
| user-menu | 📋 Queued | | | |
| power-menu | 📋 Queued | | | |
| navigation | 📋 Queued | | | Sidebar navigation |
| ~~truenas-logo~~ | 🚫 Deferred | | | Uses [fullSize] - Phase 7 |

**Phase 4 Progress:** 0/11 components (0%)

---

### 🎯 Phase 5: Large Shared Modules (Weeks 5-6)
**Status:** Not Started

#### Phase 5A: Dialog Module (6 components)
| Component | Status | Completed | Commit | Notes |
|-----------|--------|-----------|--------|-------|
| error-dialog | 📋 Queued | | | Critical for UX |
| general-dialog | 📋 Queued | | | |
| info-dialog | 📋 Queued | | | |
| job-progress-dialog | 📋 Queued | | | |
| error-template | 📋 Queued | | | Multi-error dialog |
| subsystem-partially-created | 📋 Queued | | | |

#### Phase 5B: ix-table Module (8+ components)
| Component | Status | Completed | Commit | Notes |
|-----------|--------|-----------|--------|-------|
| ix-table-head | 📋 Queued | | | |
| ix-table-body | 📋 Queued | | | |
| ix-table-pager | 📋 Queued | | | |
| ix-table-columns-selector | 📋 Queued | | | |
| ix-cell-actions | 📋 Queued | | | Has tests |
| ix-cell-actions-with-menu | 📋 Queued | | | |
| ix-cell-state-button | 📋 Queued | | | Has tests |
| ~~ix-empty-row~~ | 🚫 Check | | | May use [fullSize] |

**Phase 5 Progress:** 0/14 components (0%)

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
| Phase 1 | 6 modules | ⏳ 0 | 0% |
| Phase 2 | 6 modules | 📋 0 | 0% |
| Phase 3 | 3 modules | 📋 0 | 0% |
| Phase 4 | 11 components | 📋 0 | 0% |
| Phase 5 | 14 components | 📋 0 | 0% |
| Phase 6 | ~170 files | 📋 0 | 0% |
| Phase 7 | 14 files | 🚫 0 | Blocked |
| Phase 8 | 8 tasks | 📋 0 | 0% |
| **TOTAL** | **~224 items** | **✅ 2** | **~2%** |

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
