# Next Steps: App Version Update UX Improvements

## 🎯 Current Status

The frontend implementation is **COMPLETE** and ready for the backend API changes. All code is in place with smart fallbacks.

### What's Implemented ✅

1. **Terminology Changes**
   - "App Version" → "Version" (upstream application version)
   - "Catalog Version" → "Revision" (TrueNAS catalog revision)

2. **Smart Update Labels**
   - Shows "Update available" when app version changes
   - Shows "Revision available" when only catalog revision changes
   - Fallback: Shows "Update available" if `latest_app_version` not provided by API

3. **Clean Version Display**
   - Wizard: Shows just app version (e.g., "32.0.5")
   - Bulk update: Shows app version, hides revision if app version changing & unique
   - Update dialog: Shows "Version:" or "Revision:" row based on what changed
   - Hides version dropdown if only one version available

4. **Files Changed**
   - `src/app/interfaces/app.interface.ts` - Added `latest_app_version?: string`
   - `src/app/interfaces/application.interface.ts` - Added `latest_app_version?: string` to `AppUpgradeSummary`
   - `src/app/pages/apps/utils/version-comparison.utils.ts` - Logic to determine update type
   - `src/app/pages/apps/utils/version-formatting.utils.ts` - Smart version label formatting
   - `src/app/pages/apps/components/installed-apps/app-update-cell/` - Shows correct label
   - `src/app/pages/apps/components/installed-apps/app-update-dialog/` - Shows Version vs Revision
   - `src/app/pages/apps/components/installed-apps/app-bulk-update/` - Smart version display
   - `src/app/pages/apps/components/app-wizard/` - Clean version selection

---

## 🔧 Backend Requirements

### Required API Changes

#### 1. `app.query` Response
Add `latest_app_version` field to each app:

```json
{
  "name": "nextcloud",
  "version": "2.0.33",
  "latest_version": "2.1.26",
  "latest_app_version": "31.0.11",  // ← ADD THIS
  "human_version": "31.0.9_2.0.33",
  "metadata": {
    "app_version": "31.0.9"
  },
  ...
}
```

**How to compute `latest_app_version`:**
- Extract app version from `latest_human_version`
- If `latest_human_version` is "31.0.11_2.1.26", return "31.0.11"
- If versions are same format, return the upstream part

#### 2. `app.upgrade_summary` Response
Add `latest_app_version` field and `app_version` to each available version:

```json
{
  "latest_version": "2.1.26",
  "latest_app_version": "31.0.11",  // ← ADD THIS
  "latest_human_version": "31.0.11_2.1.26",
  "available_versions_for_upgrade": [
    {
      "version": "2.1.26",
      "human_version": "31.0.11_2.1.26",
      "app_version": "31.0.11"  // ← ADD THIS (optional but helpful)
    }
  ]
}
```

---

## 🚀 Phase 2: Performance Optimizations (After API is Ready)

### Optimization 1: Eliminate Redundant API Calls

**Current behavior:**
- User opens update dialog → calls `app.upgrade_summary` immediately
- User expands bulk update accordion → calls `app.upgrade_summary` for each app

**Optimized behavior:**
Since `app.query` now includes `latest_app_version`, we can:

1. **Show version info immediately** without API call:
   ```
   Version: 31.0.9 → 31.0.11  (no API call needed!)
   ```

2. **Only call `app.upgrade_summary` when:**
   - Multiple versions available (for the dropdown)
   - Currently we can't know this without calling the API

### Optimization 2: Add `available_versions_count` to Backend

**Backend enhancement:**
Add a count of available versions to `app.query`:

```json
{
  "name": "nextcloud",
  "upgrade_available": true,
  "available_versions_count": 1,  // ← ADD THIS
  ...
}
```

**Frontend optimization enabled:**
```typescript
// Skip app.upgrade_summary call if only one version
if (app.available_versions_count === 1) {
  // Show version info from app.query
  // Auto-select the only available version
  // No dropdown needed
  // NO API CALL! 🎉
}
```

**Performance impact:**
- Single app update with 1 version: **1 API call → 0 API calls** (100% reduction!)
- Bulk update 10 apps with 1 version each: **10 API calls → 0 API calls** (100% reduction!)

### Implementation Checklist for Phase 2

Once backend adds `available_versions_count`:

- [ ] Update `App` interface in `src/app/interfaces/app.interface.ts`:
  ```typescript
  available_versions_count?: number;
  ```

- [ ] Update `app-update-dialog.component.ts`:
  ```typescript
  // Skip upgrade_summary call if count === 1
  if (this.app.available_versions_count === 1) {
    this.selectedVersion = {
      latest_version: this.app.latest_version,
      latest_app_version: this.app.latest_app_version,
      latest_human_version: this.app.human_latest_version,
      available_versions_for_upgrade: null,
    };
    return; // Skip API call
  }
  ```

- [ ] Update `app-bulk-update.component.ts`:
  ```typescript
  // Don't expand accordion if it would be empty
  if (app.available_versions_count === 1) {
    // Just update silently, no need to show dropdown
  }
  ```

- [ ] Add tests for the optimization

---

## 📋 Testing Checklist

Once backend is deployed, test these scenarios:

### Scenario 1: App Version Update
- App: Nextcloud 31.0.9 → 31.0.11
- Catalog: 2.0.33 → 2.1.26
- **Expected:** Shows "Update available" with "Version: 31.0.9 → 31.0.11"

### Scenario 2: Revision-Only Update
- App: Syncthing 1.30.0 → 1.30.0 (same)
- Catalog: 1.2.17 → 2.0.0
- **Expected:** Shows "Revision available" with "Revision: 1.2.17 → 2.0.0"

### Scenario 3: Wizard Version Selection
- **Expected:** Shows just app versions "32.0.5", "32.0.6" (no revision clutter)

### Scenario 4: Bulk Update
- **Expected:**
  - App version changing: Shows "31.0.11" or "31.0.11 (2.1.26)" if duplicates
  - Only revision changing: Shows "1.30.0 (2.0.0)"
  - Single version: Hides dropdown

### Scenario 5: Multiple Catalog Versions with Same App Version
- Available: 24.0.6 (1.1.38), 24.0.6 (1.1.39), 24.0.6 (1.1.40)
- **Expected:** Shows with revisions "24.0.6 (1.1.38)" to avoid duplicates

---

## 🐛 Known Issues / Edge Cases

None currently! The implementation gracefully handles:
- ✅ Missing `latest_app_version` field (fallback to "Update available")
- ✅ Duplicate app versions (shows revision for uniqueness)
- ✅ Single version available (hides dropdown)
- ✅ Undefined human_version (extracts from library version)

---

## 📚 Code Reference

### Key Functions

**Version Comparison Logic:**
```typescript
// src/app/pages/apps/utils/version-comparison.utils.ts
export function analyzeVersionChange(app: App): VersionChange {
  const currentAppVersion = extractAppVersion(app.human_version, app.version);
  const latestAppVersion = app.latest_app_version;

  const hasAppVersionChange = latestAppVersion !== undefined
    ? currentAppVersion !== latestAppVersion
    : true; // Fallback

  return { hasAppVersionChange, hasRevisionChange };
}
```

**Version Label Formatting:**
```typescript
// src/app/pages/apps/utils/version-formatting.utils.ts
export function formatVersionLabel(
  libraryVersion: string,
  humanVersion: string | undefined,
  options: { showRevision?: boolean } = {},
): string {
  const appVersion = extractAppVersion(humanVersion, libraryVersion);

  if (!options.showRevision) {
    return appVersion; // Just "32.0.5"
  }

  return `${appVersion} (${libraryVersion})`; // "32.0.5 (2.1.26)"
}
```

### Update Cell Logic
```typescript
// src/app/pages/apps/components/installed-apps/app-update-cell/
protected getUpdateMessage(): string {
  const change = this.versionChange();
  if (change.hasAppVersionChange) {
    return this.translate.instant('Update available');
  }
  return this.translate.instant('Revision available');
}
```

---

## 🎓 Design Decisions

### Why "Update available" as Fallback?
When `latest_app_version` is missing (backend not ready):
- **Conservative:** Shows "Update available" for all updates
- **Safe:** Users expect this label, won't be confused
- **Automatic:** Once backend adds field, frontend automatically uses it

### Why Hide Revision When App Version Changes?
- **User focus:** Users care about upstream version (31.0.11), not catalog revision (2.1.26)
- **Reduce clutter:** Most users never need to see catalog revision
- **Exceptions:** Still shown if multiple catalog versions have same app version (for uniqueness)

### Why Keep Version Info in Bulk Update Accordion?
- **User value:** Even with single version, showing "31.0.9 → 31.0.11" is useful
- **Confirmation:** User can verify what version they're updating to
- **Consistency:** Matches single-app update dialog UX

---

## 📞 Contact

When implementing Phase 2 optimizations, review:
1. This file for context
2. All tests in `src/app/pages/apps/` (96 tests currently passing)
3. The decision summary in the original requirements (terminology, alert strategy, UI display)

---

**Last Updated:** 2026-01-22
**Status:** ✅ Phase 1 Complete, Ready for Backend API
**Next:** Wait for backend to add `latest_app_version`, then test
