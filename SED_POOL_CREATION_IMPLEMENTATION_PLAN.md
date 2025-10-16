# SED (Self-Encrypting Drive) Pool Creation Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to implement SED (Self-Encrypting Drive) encryption support in the TrueNAS pool creation wizard. The feature will detect SED-capable disks during pool creation, allow users to choose between software encryption (ZFS) and hardware encryption (SED), and filter disks accordingly.

### Implementation Status

**Phase 1: Backend Integration & Data Model** ✅ COMPLETED
- Created SedStatus enum and EncryptionType enum
- Updated disk interfaces with `sed_status` field
- Implemented store state management for SED encryption
- Added disk filtering logic for SED-capable disks
- **Comprehensive unit tests added** (22 tests covering utils, stores, and selectors)
- All data layer changes complete and verified

**Phase 2: General Step UI Components** ✅ COMPLETED
- Replaced encryption checkbox with radio group (None/Software/SED)
- Added SED password fields with validation
- Implemented Enterprise license check
- Added info/warning messages with custom CSS
- SED auto-selected as default when SED disks detected
- **Comprehensive unit tests added** (12 tests covering all SED functionality)
- All linting and type checking passed
- Production build successful

**Phase 3: Data Step & Visual Updates** ✅ COMPLETED
- SED badge added to Inventory component (Unassigned Disks)
- Configuration Preview shows encryption type (Software/SED)
- Dynamic SED password messages (info vs warning based on existing password)
- Manual Selection dialog SED Capable filter
- Review stage encryption indicator
- **Comprehensive unit tests added** (16 tests covering all Phase 3 functionality)
- All linting and type checking passed

**Phase 4-6: Remaining Tasks** - TODO
- Pool Creation Submission
- Testing & Polish
- Localization & Accessibility

## Feature Requirements (from Prototype)

Based on the prototype specification in `/Users/williamgrzybowski/scm/ux-prototyping/er38-sedui/pool-creation/prototype.md`:

### Core Functionality
1. **Detect SED-capable disks** during pool manager initialization
2. **Change Encryption UI** from checkbox to radio button group with three options:
   - None (no encryption)
   - Software Encryption (ZFS) - existing functionality
   - Self Encrypting Drives (SED) - **NEW**, default when SED disks detected -- only available to Enterprise users
3. **Dynamic disk filtering** - When SED is selected, only show SED-capable disks
4. **Global SED Password** - Required password fields (password + confirmation) when SED selected
   - It should show existing Password (same as on Advanced Settings) if any -- with a warning that this option is global for the system and not per pool, and changing it will affect other pools using SED disks.
5. **Warning messages**:
   - Info box when SED-capable disks are detected
   - Warning when Software Encryption selected despite SED disks being available
   - Banner in Data step showing filtered disk list
6. **Visual indicators**:
   - SED badge on SED-capable disks in disk lists
   - SED badge in unassigned disks sidebar when SED encryption active
   - Update configuration preview to show encryption type

---

## Current Implementation Analysis

### Existing SED Support
TrueNAS already has SED functionality in the system:
- **Global SED password** configuration at `System > Advanced > Self-Encrypting Drive`
- **Per-disk SED password** management in disk details panel
- API endpoints:
  - `disk.details` - Returns disks with `sed_status` field (UNINITIALIZED, LOCKED, UNLOCKED, UNSUPPORTED)
  - `system.advanced.sed_global_password_is_set` - Check if global password is set
  - `system.advanced.update` with `sed_passwd` - Set global SED password
  - `disk.query` with `extra: { passwords: true }` - Get disk with password info
  - `disk.update` with `passwd` field - Set per-disk SED password
  - `pool.create` with `sed_encryption: boolean` - Create pool with SED encryption

### Current Pool Creation Flow

**Store Structure** (`pool-manager.store.ts`):
```typescript
interface PoolManagerState {
  name: string;
  nameErrors: ValidationErrors | null;
  encryption: string | null; // Current: null or algorithm like "AES-256-GCM"
  diskSettings: PoolManagerDiskSettings;
  topology: PoolManagerTopology;
  // ...
}
```

**General Step** (`general-wizard-step.component.ts`):
- Simple checkbox for encryption (boolean)
- Dropdown for encryption standard (when checkbox is checked)
- Shows confirmation dialog when enabling encryption

**Disk Filtering** (`disk.utils.ts` and `pool-manager.store.ts`):
- `filterAllowedDisks()` - Filters based on:
  - Non-unique serial disks
  - Exported pools
  - Single enclosure limitation
- `allowedDisks$` selector provides filtered disks to inventory

**Inventory/Unassigned Disks** (`inventory.component.ts`):
- Groups disks by type (HDD/SSD) and size
- Shows count per group (e.g., "1 TB × 2")

---

## Implementation Plan

### Phase 1: Backend Integration & Data Model ✅ COMPLETED

#### 1.1 Add SED Detection to Disk Interface ✅
**Files**:
- `src/app/enums/sed-status.enum.ts` (NEW)
- `src/app/interfaces/disk.interface.ts`

**Implementation**:
```typescript
// src/app/enums/sed-status.enum.ts
export enum SedStatus {
  Uninitialized = 'UNINITIALIZED',
  Locked = 'LOCKED',
  Unlocked = 'UNLOCKED',
  Unsupported = 'UNSUPPORTED',
}

// src/app/interfaces/disk.interface.ts
export interface Disk {
  // ... existing fields
  sed_status?: SedStatus; // NEW: SED status from backend
}

export interface DetailsDisk {
  // ... existing fields
  sed_status?: SedStatus; // NEW: SED status from backend
}
```

**Backend Confirmation**:
- Backend provides `sed_status` field with values: UNINITIALIZED, LOCKED, UNLOCKED, UNSUPPORTED
- Disks are considered SED-capable if status is UNINITIALIZED or UNLOCKED

#### 1.2 Update Store State for Encryption Options ✅
**Files**:
- `src/app/pages/storage/modules/pool-manager/enums/encryption-type.enum.ts` (NEW)
- `src/app/pages/storage/modules/pool-manager/store/pool-manager.store.ts`

**Implementation**:
```typescript
// src/app/pages/storage/modules/pool-manager/enums/encryption-type.enum.ts
export enum EncryptionType {
  None = 'none',
  Software = 'software', // ZFS encryption
  Sed = 'sed', // Hardware SED encryption
}

// src/app/pages/storage/modules/pool-manager/store/pool-manager.store.ts
export interface PoolManagerState {
  // ... existing fields
  encryption: string | null; // KEEP: Still stores algorithm for software encryption
  encryptionType: EncryptionType; // NEW: Type of encryption selected
  sedPassword: string | null; // NEW: Global SED password for this pool
  hasSedCapableDisks: boolean; // NEW: Whether any SED disks are available
}

export const initialState: PoolManagerState = {
  // ... existing fields
  encryption: null,
  encryptionType: EncryptionType.None,
  sedPassword: null,
  hasSedCapableDisks: false,
};
```

**Selectors added**:
```typescript
readonly encryptionType$ = this.select((state) => state.encryptionType);
readonly sedPassword$ = this.select((state) => state.sedPassword);
readonly hasSedCapableDisks$ = this.select((state) => state.hasSedCapableDisks);
```

**Updaters added**:
```typescript
readonly setEncryptionOptions = this.updater((state, options: {
  encryptionType: EncryptionType;
  encryption: string | null;
  sedPassword: string | null;
}) => {
  return { ...state, ...options };
});

readonly setHasSedCapableDisks = this.updater((state, hasSedCapableDisks: boolean) => {
  return { ...state, hasSedCapableDisks };
});
```

#### 1.3 Update Disk Store to Detect SED Capability ✅
**File**: `src/app/pages/storage/modules/pool-manager/store/disk.store.ts`

**Implementation**:
```typescript
import { isSedCapable } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';

export class DiskStore extends ComponentStore<DiskState> {
  // ... existing code

  readonly hasSedCapableDisks$ = this.select(
    this.selectableDisks$,
    (disks) => disks.some((disk) => isSedCapable(disk)),
  );

  // No changes needed to loadDisks() - it already loads disk.details
  // The hasSedCapableDisks$ selector automatically computes based on loaded disks
}
```

**Changes in pool-manager.store.ts**:
```typescript
loadStateInitialData(): Observable<[Enclosure[], DiskDetailsResponse]> {
  return forkJoin([
    this.api.call('enclosure2.query'),
    this.diskStore.loadDisks(),
  ]).pipe(
    tapResponse({
      next: ([enclosures]) => {
        this.patchState({ isLoading: false, enclosures });

        // Set hasSedCapableDisks from disk store
        this.diskStore.hasSedCapableDisks$.pipe(take(1)).subscribe((hasSedCapableDisks) => {
          this.setHasSedCapableDisks(hasSedCapableDisks);
        });
      },
      // ... error handling
    }),
  );
}
```

#### 1.4 Update Disk Filtering Logic ✅
**File**: `src/app/pages/storage/modules/pool-manager/utils/disk.utils.ts`

**Implementation**:
```typescript
import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';

export function isSedCapable(disk: DetailsDisk): boolean {
  return disk.sed_status === SedStatus.Uninitialized || disk.sed_status === SedStatus.Unlocked;
}

export function filterAllowedDisks(allDisks: DetailsDisk[], options: {
  allowNonUniqueSerialDisks: boolean;
  allowExportedPools: string[];
  limitToSingleEnclosure: string | null;
  requireSedCapable?: boolean; // NEW: Optional parameter
}): DetailsDisk[] {
  return allDisks.filter((disk) => {
    // ... existing filters (non-unique serial, exported pools, enclosure)

    // NEW: Filter for SED-capable disks only
    if (options.requireSedCapable && !isSedCapable(disk)) {
      return false;
    }

    return true;
  });
}
```

**Update in pool-manager.store.ts**:
```typescript
readonly allowedDisks$ = this.select(
  this.diskStore.selectableDisks$,
  this.diskSettings$,
  this.enclosureSettings$,
  this.encryptionType$, // NEW
  (unusedDisks, diskOptions, enclosureOptions, encryptionType) => filterAllowedDisks(unusedDisks, {
    ...diskOptions,
    ...enclosureOptions,
    requireSedCapable: encryptionType === EncryptionType.Sed, // NEW
  }),
);
```

---

### Phase 2: UI Components - General Step (Step 1)

#### 2.1 Update General Wizard Step Component
**File**: `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component.ts`

**Major Changes**:

```typescript
export class GeneralWizardStepComponent implements OnInit, OnChanges {
  // ... existing injects

  form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    encryptionType: [EncryptionType.None], // CHANGED: From boolean to enum
    encryptionStandard: [defaultEncryptionStandard, Validators.required],
    sedPassword: [''], // NEW
    sedPasswordConfirm: [''], // NEW
  }, {
    validators: [
      // NEW: Password match validator
      matchOthersFgValidator(
        'sedPasswordConfirm',
        ['sedPassword'],
        this.translate.instant('SED passwords must match.'),
      ),
    ],
  });

  // NEW: Observable for SED detection
  hasSedCapableDisks$ = this.store.hasSedCapableDisks$;

  // NEW: Encryption type options
  encryptionTypeOptions$ = this.hasSedCapableDisks$.pipe(
    map((hasSedDisks) => {
      const options = [
        { label: this.translate.instant('None'), value: EncryptionType.None },
        { label: this.translate.instant('Software Encryption (ZFS)'), value: EncryptionType.Software },
      ];

      if (hasSedDisks) {
        options.push({
          label: this.translate.instant('Self Encrypting Drives (SED)'),
          value: EncryptionType.Sed,
        });
      }

      return options;
    }),
  );

  ngOnInit(): void {
    this.initEncryptionField();
    this.initSedDefaults(); // NEW
    this.connectGeneralOptionsToStore();

    this.store.startOver$.pipe(untilDestroyed(this)).subscribe(() => {
      this.resetForm(); // NEW: Separate method for reset
    });
  }

  private initSedDefaults(): void {
    // Set SED as default if SED-capable disks detected
    this.hasSedCapableDisks$
      .pipe(take(1), untilDestroyed(this))
      .subscribe((hasSedDisks) => {
        if (hasSedDisks && !this.isAddingVdevs()) {
          this.form.patchValue({ encryptionType: EncryptionType.Sed });
        }
      });
  }

  private initEncryptionField(): void {
    // UPDATED: Handle both software and SED encryption warnings
    this.form.controls.encryptionType.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((encryptionType) => {
        if (encryptionType === EncryptionType.Software) {
          this.showSoftwareEncryptionWarning(); // NEW
        } else if (encryptionType === EncryptionType.Sed) {
          this.showSedEncryptionInfo(); // NEW
        }
      });
  }

  private showSoftwareEncryptionWarning(): void {
    // Only show if SED disks are available
    this.hasSedCapableDisks$
      .pipe(take(1), untilDestroyed(this))
      .subscribe((hasSedDisks) => {
        if (!hasSedDisks) {
          // Show original encryption warning
          this.showOriginalEncryptionWarning();
          return;
        }

        this.dialog
          .confirm({
            title: this.translate.instant('Warning'),
            message: this.translate.instant(
              'Hardware-based SED encryption is available and provides better performance and security for Enterprise use cases. Are you sure you want to use Software Encryption instead?'
            ),
            buttonText: this.translate.instant('Use Software Encryption'),
            cancelText: this.translate.instant('Use SED Instead'),
          })
          .pipe(untilDestroyed(this))
          .subscribe((confirmed) => {
            if (!confirmed) {
              this.form.controls.encryptionType.setValue(EncryptionType.Sed);
            }
            this.cdr.markForCheck();
          });
      });
  }

  private connectGeneralOptionsToStore(): void {
    combineLatest([
      this.form.controls.name.statusChanges,
      this.form.controls.name.valueChanges.pipe(startWith('')),
      this.form.controls.encryptionType.valueChanges.pipe(startWith(EncryptionType.None)),
      this.form.controls.encryptionStandard.valueChanges.pipe(startWith('AES-256-GCM')),
      this.form.controls.sedPassword.valueChanges.pipe(startWith('')),
    ]).pipe(untilDestroyed(this)).subscribe(([, name, encryptionType, encryptionStandard, sedPassword]) => {
      this.store.setGeneralOptions({
        name,
        nameErrors: this.form.controls.name.errors,
        encryption: encryptionType === EncryptionType.Software ? encryptionStandard : null,
      });

      this.store.setEncryptionOptions({
        encryptionType,
        encryption: encryptionType === EncryptionType.Software ? encryptionStandard : null,
        sedPassword: encryptionType === EncryptionType.Sed ? sedPassword : null,
      });
    });
  }
}
```

#### 2.2 Update General Step Template
**File**: `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component.html`

```html
<ng-container [formGroup]="form">
  <ix-input
    formControlName="name"
    [label]="'Name' | translate"
    [required]="true"
    [readonly]="isAddingVdevs()"
  ></ix-input>

  @if (!isAddingVdevs()) {
    <!-- NEW: Info box when SED disks detected -->
    @if (hasSedCapableDisks$ | async) {
      <ix-info-box>
        {{ 'SED-capable (Self-Encrypting Drive) disks detected. Hardware-based encryption provides better performance and security.' | translate }}
      </ix-info-box>
    }

    <!-- CHANGED: From checkbox to radio group -->
    <ix-radio-group
      formControlName="encryptionType"
      [label]="'Encryption' | translate"
      [options]="encryptionTypeOptions$ | async"
    ></ix-radio-group>

    <!-- UPDATED: Only show for Software Encryption -->
    @if (form.controls.encryptionType.value === 'software') {
      <ix-select
        formControlName="encryptionStandard"
        [label]="'Encryption Standard' | translate"
        [options]="encryptionAlgorithmOptions$"
        [required]="true"
      ></ix-select>
    }

    <!-- NEW: SED Password fields -->
    @if (form.controls.encryptionType.value === 'sed') {
      <ix-warning-box>
        {{ 'Software Encryption is not recommended when SED-capable disks are available. Hardware-based SED encryption provides better performance and security for Enterprise use cases.' | translate }}
      </ix-warning-box>

      <ix-input
        formControlName="sedPassword"
        [label]="'Global SED Password' | translate"
        [type]="'password'"
        [required]="true"
        [tooltip]="'This password will be used to configure all SED-capable disks in this pool.' | translate"
      ></ix-input>

      <ix-input
        formControlName="sedPasswordConfirm"
        [label]="'Confirm SED Password' | translate"
        [type]="'password'"
        [required]="true"
      ></ix-input>
    }
  }

  <ix-pool-warnings></ix-pool-warnings>

  <ix-form-actions>
    <div class="step-buttons">
      <button
        mat-button
        matStepperNext
        color="primary"
        type="button"
        ixTest="next-general"
        [disabled]="form.invalid"
      >
        {{ 'Next' | translate }}
      </button>
    </div>
  </ix-form-actions>
</ng-container>
```

**Implementation Notes**:
- Used existing `IxRadioGroupComponent` (no new component needed)
- Created `.sed-info-message` CSS class for blue info boxes (instead of separate component)
- Created `.sed-global-password-warning` CSS class for yellow warning boxes (instead of separate component)
- This approach is simpler and maintains consistency with existing codebase patterns

---

### Phase 3: UI Components - Data Step & Visual Updates ✅ COMPLETED

#### 3.1 Update Inventory Component for SED Badge ✅
**File**: `src/app/pages/storage/modules/pool-manager/components/inventory/inventory.component.html`

**Implementation**:
Updated heading to show SED badge when SED encryption is active:

```html
<h3 mat-card-title>
  {{ 'Unassigned Disks' | translate }}
  @if ((encryptionType$ | async) === EncryptionType.Sed) {
    <span class="sed-badge">{{ 'SED' | translate }}</span>
  }
</h3>
```

Added CSS styling in `inventory.component.scss`:
```scss
.sed-badge {
  background-color: var(--primary);
  border-radius: 4px;
  color: var(--contrast-darkest);
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  margin-left: 8px;
  padding: 4px 8px;
  text-transform: uppercase;
  vertical-align: middle;
}
```

Added selector in `inventory.component.ts`:
```typescript
protected encryptionType$ = this.poolManagerStore.encryptionType$;
```

**Tests**: Unit test added to verify SED badge appears when SED encryption is selected

#### 3.2 Update Configuration Preview ✅
**Files**:
- `src/app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component.ts`
- `src/app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component.html`

**Implementation**:
Updated to show encryption type more clearly based on `EncryptionType`:

```html
<div class="config-item">
  <h3>{{ 'Encryption' | translate }}</h3>
  @if ((encryptionType$ | async) === EncryptionType.None) {
    {{ 'None' | translate }}
  } @else if ((encryptionType$ | async) === EncryptionType.Software) {
    {{ 'Software (ZFS)' | translate }} - {{ (encryption$ | async) || unknownProp }}
  } @else if ((encryptionType$ | async) === EncryptionType.Sed) {
    {{ 'Hardware (SED)' | translate }}
  }
</div>
```

Added selector in component:
```typescript
protected encryptionType$ = this.store.encryptionType$;
protected readonly EncryptionType = EncryptionType;
```

**Tests**: Unit tests added to verify all three encryption types display correctly

#### 3.3 Dynamic SED Password Messages ✅
**File**: `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component.ts`

**Implementation**:
Added API call to check if global SED password is already set:

```typescript
isSedPasswordSet$ = this.api.call('system.advanced.sed_global_password_is_set');
```

Updated template to show different messages:
- **Info message** (blue) when no password is set
- **Warning message** (yellow) when password already exists

```html
@if (isSedPasswordSet$ | async) {
  <div class="sed-global-password-warning">
    {{ helptext.sedGlobalPasswordWarning | translate }}
  </div>
} @else {
  <div class="sed-info-message">
    {{ helptext.sedGlobalPasswordInfo | translate }}
  </div>
}
```

**Tests**: Unit tests added for both scenarios

#### 3.4 Data Step Warning ✅ (Removed per user feedback)
**Decision**: Initially implemented a warning banner in Data Step showing "Only SED-capable disks are shown", but user feedback indicated this was unnecessary. The SED badge in Inventory component provides sufficient indication. Warning was removed.

#### 3.5 Manual Selection Dialog SED Capable Filter ✅
**Files**:
- `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component.ts`
- `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disks.component.ts`
- `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component.ts`
- `src/app/pages/storage/modules/pool-manager/store/pool-manager.store.ts`

**Implementation**:
Added "SED Capable" checkbox filter to Manual Selection dialog:

1. **Added `isSedEncryption` parameter** to dialog interface:
```typescript
export interface ManualDiskSelectionParams {
  layout: CreateVdevLayout;
  enclosures: Enclosure[];
  inventory: DetailsDisk[];
  vdevs: DetailsDisk[][];
  vdevsLimit: number | null;
  isSedEncryption?: boolean;
}
```

2. **Passed parameter when opening dialog** in `pool-manager.store.ts`:
```typescript
return this.matDialog.open(ManualDiskSelectionComponent, {
  data: {
    // ... other fields
    isSedEncryption: state.encryptionType === EncryptionType.Sed,
  } as ManualDiskSelectionParams,
});
```

3. **Added checkbox to filter form**:
```typescript
protected filterForm = this.formBuilder.group({
  search: [''],
  diskType: ['' as DiskType],
  diskSize: [''],
  sedCapable: [false],
});
```

4. **Auto-check and disable when SED encryption active**:
```typescript
private updateSedFilter(): void {
  if (this.isSedEncryption()) {
    this.filterForm.controls.sedCapable.setValue(true);
    this.filterForm.controls.sedCapable.disable();
  } else {
    this.filterForm.controls.sedCapable.enable();
  }
}
```

5. **Filter disks by SED capability** using `isSedCapable()` utility:
```typescript
const sedCapableMatches = filterValues.sedCapable ? isSedCapable(disk) : true;
return typeMatches && sizeMatches && searchMatches && sedCapableMatches;
```

**Tests**:
- `manual-selection-disk-filters.component.spec.ts`: 8 tests (checkbox behavior, auto-check/disable)
- `manual-selection-disks.component.spec.ts`: 3 tests (disk filtering by SED capability)

#### 3.6 Review Stage Encryption Indicator ✅
**Files**:
- `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.component.ts`
- `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.component.html`

**Implementation**:
Updated Review stage to show encryption type in General Info section:

```html
@if (state.encryptionType !== EncryptionType.None) {
  <div class="summary-item">
    <div class="label">{{ 'Encryption' | translate }}</div>
    <div class="value">
      @if (state.encryptionType === EncryptionType.Software) {
        {{ 'Software (ZFS)' | translate }} - {{ state.encryption }}
      } @else if (state.encryptionType === EncryptionType.Sed) {
        {{ 'Hardware (SED)' | translate }}
      }
    </div>
  </div>
}
```

Added selector in component:
```typescript
protected readonly EncryptionType = EncryptionType;
```

Updated `showStartOver` logic to check `encryptionType` instead of `encryption`:
```typescript
get showStartOver(): boolean {
  return Boolean(
    this.state.name
    || this.state.encryptionType !== EncryptionType.None
    || this.nonEmptyTopologyCategories?.length,
  );
}
```

**Tests**:
- Test for software encryption display: "Software (ZFS) - aes-256-gcm"
- Test for hardware (SED) encryption display: "Hardware (SED)"
- Test for no encryption: Encryption field not shown

---

### Phase 4: Pool Creation Submission & Backend Integration

#### 4.1 Update Pool Creation Payload
**File**: `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component.ts`

**Implementation Strategy** (confirmed with backend team):

```typescript
private createPool(): void {
  const encryptionType = this.store.encryptionType;

  // Step 1: If SED encryption, update global SED password first
  const sedPasswordUpdate$ = encryptionType === EncryptionType.Sed
    ? this.api.call('system.advanced.update', [{ sed_passwd: this.store.sedPassword }])
    : of(null);

  sedPasswordUpdate$.pipe(
    switchMap(() => {
      // Step 2: Create pool with sed_encryption flag
      const payload: any = {
        name: this.store.name,
        topology: topologyPayload,
        // ... other fields
      };

      // UPDATED: Handle encryption based on type
      if (encryptionType === EncryptionType.Software) {
        payload.encryption = true;
        payload.encryption_options = {
          algorithm: this.store.encryption,
        };
      } else if (encryptionType === EncryptionType.Sed) {
        // NEW: Set SED encryption flag (backend handles password application)
        payload.sed_encryption = true;
      }

      return this.api.call('pool.create', [payload]);
    }),
    // ... existing error handling and success logic
  ).subscribe();
}
```

**Alternative approach** - Check if password already set and only update if different:
```typescript
// Check if global SED password is already set
this.api.call('system.advanced.sed_global_password_is_set').pipe(
  switchMap((passwordIsSet) => {
    // Only update if password is new or different
    if (encryptionType === EncryptionType.Sed && this.store.sedPassword) {
      return this.api.call('system.advanced.update', [{ sed_passwd: this.store.sedPassword }]);
    }
    return of(null);
  }),
  // ... continue with pool creation
)
```

#### 4.2 Pool Creation API Considerations ✅ CONFIRMED

**Backend API**:
1. ✅ `pool.create` accepts `sed_encryption: boolean` field
2. ✅ SED password is set via separate `system.advanced.update` call with `sed_passwd` field
3. ✅ Backend validates that all disks in topology support SED when `sed_encryption` is true
4. ✅ Backend applies global SED password to all disks in the pool during creation
5. ✅ Standard API error responses for failures

**Error Handling**:
- Disk doesn't support SED → Backend returns error with disk name
- SED password update fails → Show error and abort pool creation
- Pool creation with SED fails → Show error from backend
- Validation errors → Display in UI before submission

**Important Notes**:
- Global SED password affects ALL pools using SED, not just the new pool
- UI should warn users when updating existing global password
- Consider showing password status (set/not set) before pool creation

---

### Phase 5: Testing

**Test Coverage Status:**
- ✅ **Phase 1 (Data Layer)**: 22 tests - ALL PASSING
- ✅ **Phase 2 (General Step UI)**: 12 tests - ALL PASSING
- ✅ **Phase 3 (Visual Updates)**: 16 tests - ALL PASSING
- ⏸️ **Phase 4 (Integration Tests)**: TODO - To be implemented in Phase 4

#### 5.1 Unit Tests

**✅ COMPLETED - Phase 1 Data Layer Tests (22 tests, all passing):**

**Test File: `disk.utils.spec.ts`** (15 tests total)
- ✅ 5 tests for `isSedCapable()` - Tests all SED status values (UNINITIALIZED, UNLOCKED, LOCKED, UNSUPPORTED, undefined)
- ✅ 3 tests for `filterAllowedDisks()` with SED filtering - Tests filtering behavior with requireSedCapable parameter
- ✅ Existing tests for `hasNonUniqueSerial()`, `hasExportedPool()`, and other disk filtering scenarios

**Test File: `pool-manager.store.spec.ts`** (23 tests total)
- ✅ 3 tests for `setEncryptionOptions()` - Tests setting SED, software, and no encryption
- ✅ 2 tests for `setHasSedCapableDisks()` - Tests setting flag to true/false
- ✅ 3 tests for selectors - Tests `encryptionType$`, `sedPassword$`, and `hasSedCapableDisks$`
- ✅ Existing tests for other pool manager functionality

**Test File: `disk.store.spec.ts`** (6 tests)
- ✅ 6 tests for `hasSedCapableDisks$` selector
  - Returns true for UNINITIALIZED and UNLOCKED disks
  - Returns false for no SED disks or only LOCKED/UNSUPPORTED disks
  - Checks both unused and used disks
  - Handles mixed SED and non-SED disk scenarios

**✅ COMPLETED - Phase 2 UI Component Tests:**

**General Step Tests** (`general-wizard-step.component.spec.ts`) - **12 tests, all passing**:
- ✅ Updates store when name is edited
- ✅ Shows encryption type radio group with None and Software options when no SED disks
- ✅ Shows Encryption Standard dropdown when Software Encryption is selected
- ✅ Shows warning when Software Encryption is selected
- ✅ Updates store when Software Encryption fields are updated
- ✅ Requires SED password when SED encryption type is selected
- ✅ Validates that SED passwords match
- ✅ Updates store with SED password when SED is selected
- ✅ Does not require SED password when encryption type is None
- ✅ Sets encryption type to SED when adding VDEVs to SED pool
- ✅ Disables encryption fields when adding VDEVs
- ✅ Resets form to default encryption type (None) when Start Over is triggered

**✅ COMPLETED - Phase 3 Visual Updates Tests (16 tests, all passing):**

**Configuration Preview Tests** (`configuration-preview.component.spec.ts`) - **3 tests**:
- ✅ Shows "None" when encryption type is None
- ✅ Shows "Software (ZFS) - aes-256-gcm" when Software encryption is selected
- ✅ Shows "Hardware (SED)" when SED encryption is selected

**Inventory Component Tests** (`inventory.component.spec.ts`) - **1 test**:
- ✅ Shows SED badge next to "Unassigned Disks" when SED encryption is selected

**Manual Selection Disk Filters Tests** (`manual-selection-disk-filters.component.spec.ts`) - **8 tests**:
- ✅ Shows search input that emits (filtersUpdated) on change
- ✅ Shows disk type select with available disk types
- ✅ Emits (filtersUpdated) when disk type select is changed
- ✅ Shows disk size select with available disk sizes
- ✅ Emits (filtersUpdated) when disk size select is changed
- ✅ Shows SED Capable checkbox that emits (filtersUpdated) when checked
- ✅ Checks and disables SED Capable checkbox when SED encryption is enabled
- ✅ Allows SED Capable checkbox to be changed when SED encryption is not enabled

**Manual Selection Disks Tests** (`manual-selection-disks.component.spec.ts`) - **3 tests**:
- ✅ Shows a list of disks grouped by enclosure
- ✅ Updates disks shown when filters are updated
- ✅ Filters disks by SED Capable when sedCapable filter is enabled

**Review Wizard Step Tests** (`review-wizard-step.component.spec.ts`) - **13 tests total, 3 new for encryption**:
- ✅ Shows software encryption as "Software (ZFS) - aes-256-gcm"
- ✅ Shows hardware (SED) encryption as "Hardware (SED)"
- ✅ Does not show encryption when encryption type is None

**TODO - Phase 4 Integration Tests:**


#### 5.2 Integration Tests

**Pool Creation Flow** (`create-pool.spec.ts`):
```typescript
it('creates pool with SED encryption when SED option selected', async () => {
  // Navigate to pool creation
  // Fill in pool name
  // Select SED encryption
  // Enter SED password
  // Configure topology with SED disks
  // Submit
  // Verify API was called with correct payload
});

it('shows error when trying to create SED pool without SED-capable disks', () => {
  // Mock no SED disks available
  // Verify SED option is not shown
});
```

#### 5.3 Manual Testing Scenarios

1. **SED Disks Available**:
   - Verify SED option appears
   - Verify SED is default selection
   - Verify password fields appear
   - Verify disk list filters to SED-only
   - Verify badges appear on disks
   - Verify configuration preview shows SED

2. **No SED Disks Available**:
   - Verify SED option does NOT appear
   - Verify original encryption behavior works

3. **Mixed Disk Environment**:
   - Have both SED and non-SED disks
   - Select None → all disks visible
   - Select Software → all disks visible
   - Select SED → only SED disks visible
   - Verify unassigned disk counts update correctly

4. **Warning Dialogs**:
   - Select Software Encryption when SED available → verify warning
   - Cancel warning → verify switches back to SED
   - Confirm warning → verify stays on Software

5. **Form Validation**:
   - SED password required when SED selected
   - Password confirmation must match
   - Can't proceed to next step without valid form

6. **Pool Creation**:
   - Create pool with SED encryption
   - Verify pool is created successfully
   - Verify disks have SED password set
   - Verify pool shows SED encryption in pool details

---

### Phase 6: Localization & Accessibility

#### 6.1 Translation Strings

Add to appropriate translation files:

```typescript
// In helptext or translation files
export const sedPoolCreation = {
  encryptionTypeLabel: 'Encryption',
  sedPasswordLabel: 'Global SED Password',
  sedPasswordConfirmLabel: 'Confirm SED Password',
  sedPasswordTooltip: 'This password will be used to configure all SED-capable disks in this pool.',
  sedInfoMessage: 'SED-capable (Self-Encrypting Drive) disks detected. Hardware-based encryption provides better performance and security.',
  softwareEncryptionWarning: 'Hardware-based SED encryption is available and provides better performance and security for Enterprise use cases. Are you sure you want to use Software Encryption instead?',
  sedFilterWarning: 'Only encryption-capable (SED) disks are shown because SED encryption is enabled.',
  encryptionTypeNone: 'None',
  encryptionTypeSoftware: 'Software Encryption (ZFS)',
  encryptionTypeSed: 'Self Encrypting Drives (SED)',
};
```

#### 6.2 Accessibility Considerations

- Ensure radio buttons have proper ARIA labels
- Password fields have proper autocomplete attributes
- Warning messages are announced by screen readers
- Badge has proper alt text or aria-label
- Form validation errors are accessible

---

## Implementation Phases & Timeline

### Phase 1: Backend & Data ✅ COMPLETED
- [x] Coordinate with middleware on SED detection API
  - Confirmed: Backend provides `sed_status` field with values UNINITIALIZED, LOCKED, UNLOCKED, UNSUPPORTED
- [x] Create SedStatus enum (`src/app/enums/sed-status.enum.ts`)
- [x] Create EncryptionType enum (`src/app/pages/storage/modules/pool-manager/enums/encryption-type.enum.ts`)
- [x] Update disk interface for SED capability (`sed_status` field added to Disk and DetailsDisk)
- [x] Update store state and selectors (encryptionType, sedPassword, hasSedCapableDisks)
- [x] Implement disk filtering logic (isSedCapable function, filterAllowedDisks updated)
- [x] Update disk.store.ts with hasSedCapableDisks$ selector
- [x] Update pool-manager.store.ts with SED-aware allowedDisks$ selector
- [x] Unit tests for store and utils
  - ✅ **disk.utils.spec.ts**: 5 tests for `isSedCapable()`, 3 tests for `filterAllowedDisks()` with SED filtering
  - ✅ **pool-manager.store.spec.ts**: 8 tests for encryption state management (setEncryptionOptions, setHasSedCapableDisks, selectors)
  - ✅ **disk.store.spec.ts** (NEW): 6 tests for `hasSedCapableDisks$` selector covering all scenarios

### Phase 2: General Step UI ✅ COMPLETED
- [x] Create/verify UI components (radio group, info/warning boxes)
  - Used existing `IxRadioGroupComponent`
  - Created custom CSS for info/warning message boxes (no separate components needed)
- [x] Update General Wizard Step component
  - Changed from `encryption` boolean to `encryptionType` enum
  - Added `sedPassword` and `sedPasswordConfirm` form fields
  - Implemented password matching validation using `matchOthersFgValidator`
  - Added Enterprise license check via `selectIsEnterprise` selector
  - Implemented SED as default when SED disks detected
  - Updated store integration for encryption options
  - Added logic for VDEVs to SED pools (filters to SED-only disks)
- [x] Update General Wizard Step template
  - Radio group with 3 options (None, Software, SED)
  - SED option only shown for Enterprise + SED disks
  - Info message when SED disks detected
  - Warning about global SED password
  - SED password and confirmation fields
  - Message for adding VDEVs to SED pool
- [x] Unit tests for General Step
  - 12 comprehensive tests covering all SED functionality
  - Tests for encryption type selection, password validation, VDEVs, form reset
  - All tests passing
- [x] Linting and build verification
  - Fixed import order issues
  - Removed unused imports
  - Production build successful

### Phase 3: Data Step & Visual Updates ✅ COMPLETED
- [x] Add SED badge to Inventory component (Unassigned Disks heading)
- [x] Update Configuration Preview to show encryption type
- [x] Dynamic SED password messages (info vs warning)
- [x] Manual Selection dialog SED Capable filter
- [x] Review stage encryption indicator
- [x] Unit tests for all updated components (16 tests)
  - Configuration Preview tests (3 tests for encryption types)
  - Inventory component tests (1 test for SED badge)
  - Manual Selection filter tests (8 tests for SED Capable checkbox)
  - Manual Selection disks tests (3 tests for filtering)
  - Review wizard step tests (3 tests for encryption display)

### Phase 4: Pool Creation & Integration (Week 4-5)
- [ ] Update pool creation payload handling
- [ ] Implement error handling for SED
- [ ] Integration with backend API
- [ ] Integration tests
- [ ] End-to-end testing

### Phase 5: Polish & Testing (Week 5-6)
- [ ] Comprehensive manual testing
- [ ] Edge case testing
- [ ] Localization and accessibility review
- [ ] Documentation updates
- [ ] Code review and cleanup

---

## Dependencies & Coordination

### Middleware/Backend Team
1. **API Endpoint**: ✅ CONFIRMED
   - `disk.details` provides `sed_status` field with values: UNINITIALIZED, LOCKED, UNLOCKED, UNSUPPORTED
   - Disks with status UNINITIALIZED or UNLOCKED are considered SED-capable

2. **Pool Creation API**: ✅ CONFIRMED
   - `pool.create` will accept `sed_encryption: boolean` field
   - SED password will be set via separate API call to update global SED password
   - Uses existing `system.advanced.update` with `sed_passwd` field
   - Check if password already set via `system.advanced.sed_global_password_is_set`

3. **SED Setup**: ✅ CONFIRMED
   - Backend will handle applying SED password to all disks in topology
   - Backend will validate that all disks support SED
   - Error handling if SED setup fails will be provided via standard API error responses

### UX/Design Team
1. Confirm warning message wording
2. Confirm SED badge styling and placement
3. Review prototype vs implementation for any discrepancies

---

## Open Questions

1. ✅ **SED Detection**: ANSWERED
   - Backend provides `sed_status` field on disk objects
   - Values: UNINITIALIZED, LOCKED, UNLOCKED, UNSUPPORTED
   - Disks with UNINITIALIZED or UNLOCKED are SED-capable

2. ✅ **Password Storage**: ANSWERED
   - SED password stored in system advanced settings (global)
   - Use `system.advanced.sed_global_password_is_set` to check if set
   - Use `system.advanced.update` with `sed_passwd` to set/update
   - **Important**: This is a global password, not per-pool
   - UI should warn users that changing password affects all pools using SED

3. **Mixed Pools**: What happens if user later adds non-SED disks to an SED pool?
   - Should this be prevented?
   - Should pool become "mixed" encryption?
   - **TODO**: Clarify with product team

4. ✅ **Existing Pools**: ANSWERED (partially)
   - Cannot convert existing pools to SED encryption (out of scope)
   - Pool detail view should show if pool uses SED encryption (future enhancement)

5. **Performance**: Any performance considerations for SED detection on systems with many disks?
   - `sed_status` is provided by backend, no additional API calls needed
   - Should be minimal overhead
   - **TODO**: Monitor in production

6. ✅ **Enterprise vs Core**: ANSWERED & IMPLEMENTED
   - SED encryption is Enterprise-only feature
   - UI checks license type via `selectIsEnterprise` selector
   - SED option only shown for Enterprise users with SED-capable disks
   - ✅ Implemented in Phase 2

---

## Risks & Mitigation

### Risk 1: Backend API Not Ready
**Impact**: High
**Mitigation**:
- Coordinate early with middleware team
- Use mock data for frontend development
- Plan buffer time for API integration

### Risk 2: SED Detection Unreliable
**Impact**: Medium
**Mitigation**:
- Implement robust detection logic
- Add fallback methods
- Clear error messages to user

### Risk 3: Complex Disk Filtering Logic
**Impact**: Medium
**Mitigation**:
- Comprehensive unit tests
- Edge case testing
- Code review focus on filtering logic

### Risk 4: User Confusion
**Impact**: Low
**Mitigation**:
- Clear warning messages
- Tooltips and help text
- Good default behavior (SED as default)

---

## Success Criteria

1. **Functional**:
   - SED-capable disks are correctly detected
   - UI correctly shows/hides SED option based on disk availability
   - SED encryption defaults when available
   - Disk filtering works correctly
   - Pool creation succeeds with SED encryption
   - SED password is correctly applied to all disks

2. **User Experience**:
   - User understands when SED is available
   - Clear warnings guide user to best choice
   - Visual indicators (badges) are clear and helpful
   - Form validation prevents errors

3. **Quality**:
   - 80%+ unit test coverage for new code
   - All integration tests pass
   - No accessibility violations
   - No console errors or warnings

4. **Performance**:
   - No noticeable performance degradation
   - SED detection doesn't slow down wizard load

---

## Future Enhancements (Out of Scope)

1. Convert existing pools to SED encryption
2. Per-disk SED password support (vs global)
3. SED status dashboard/monitoring
4. Automatic SED password rotation
5. Integration with KMIP for SED passwords
6. Support for mixed SED/non-SED pools

---

## References

- Prototype: `/Users/williamgrzybowski/scm/ux-prototyping/er38-sedui/pool-creation/prototype.md`
- Existing SED implementation: `src/app/pages/system/advanced/self-encrypting-drive/`
- Pool Manager: `src/app/pages/storage/modules/pool-manager/`
- Hardware Disk Encryption: `src/app/pages/storage/modules/vdevs/components/hardware-disk-encryption/`

---

## Appendix: File Checklist

### New Files Created ✅ (Phase 1)
- [x] `src/app/enums/sed-status.enum.ts` - SED status enum
- [x] `src/app/pages/storage/modules/pool-manager/enums/encryption-type.enum.ts` - Encryption type enum
- [x] `src/app/pages/storage/modules/pool-manager/store/disk.store.spec.ts` - Test file for disk store SED detection (NEW)

### New Files to Create (Phase 2+)
- [ ] `src/app/pages/storage/modules/pool-manager/components/disk-badge/disk-badge.component.ts`

### Files Modified ✅ (Phase 1)

**Enums**:
- [x] `src/app/enums/sed-status.enum.ts` (new)
- [x] `src/app/pages/storage/modules/pool-manager/enums/encryption-type.enum.ts` (new)

**Interfaces**:
- [x] `src/app/interfaces/disk.interface.ts` - Added `sed_status?: SedStatus` to Disk and DetailsDisk

**Store**:
- [x] `src/app/pages/storage/modules/pool-manager/store/pool-manager.store.ts` - Added encryption state, selectors, updaters
- [x] `src/app/pages/storage/modules/pool-manager/store/disk.store.ts` - Added hasSedCapableDisks$ selector

**Utils**:
- [x] `src/app/pages/storage/modules/pool-manager/utils/disk.utils.ts` - Added isSedCapable() and updated filterAllowedDisks()

**Tests**:
- [x] `src/app/pages/storage/modules/pool-manager/utils/disk.utils.spec.ts` - Added 8 tests for SED utility functions
- [x] `src/app/pages/storage/modules/pool-manager/store/pool-manager.store.spec.ts` - Added 8 tests for SED encryption state management
- [x] `src/app/pages/storage/modules/pool-manager/store/disk.store.spec.ts` - Created with 6 tests for SED disk detection (NEW)

### Files Modified (Phase 2) ✅

**Components**:
- [x] `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component.ts`
- [x] `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component.html`
- [x] `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component.scss`
- [x] `src/app/interfaces/pool.interface.ts` - Added `sed_encryption?: boolean` to Pool and CreatePool interfaces

**Helptext**:
- [x] `src/app/helptext/storage/volumes/pool-creation/pool-creation.ts` - Added 9 SED translation strings

**Tests**:
- [x] `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component.spec.ts` - Comprehensive test suite with 12 tests

### Files Modified (Phase 3) ✅

**Components**:
- [x] `src/app/pages/storage/modules/pool-manager/components/inventory/inventory.component.ts` - Added `encryptionType$` selector
- [x] `src/app/pages/storage/modules/pool-manager/components/inventory/inventory.component.html` - Added SED badge to heading
- [x] `src/app/pages/storage/modules/pool-manager/components/inventory/inventory.component.scss` - Added `.sed-badge` styling
- [x] `src/app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component.ts` - Added `encryptionType$` selector and `EncryptionType` property
- [x] `src/app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component.html` - Updated encryption display logic
- [x] `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component.ts` - Added `isSedEncryption` to interface
- [x] `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component.html` - Passed `isSedEncryption` to child component
- [x] `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disks.component.ts` - Added `isSedEncryption` input, filter logic
- [x] `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disks.component.html` - Passed `isSedEncryption` to filters
- [x] `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component.ts` - Added `sedCapable` filter, auto-check/disable logic
- [x] `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component.html` - Added SED Capable checkbox
- [x] `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.component.ts` - Added `EncryptionType` property, updated `showStartOver` logic
- [x] `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.component.html` - Updated encryption display in General Info
- [x] `src/app/pages/storage/modules/pool-manager/store/pool-manager.store.ts` - Passed `isSedEncryption` when opening Manual Selection dialog

**Tests**:
- [x] `src/app/pages/storage/modules/pool-manager/components/inventory/inventory.component.spec.ts` - Test for SED badge
- [x] `src/app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component.spec.ts` - Tests for encryption type display
- [x] `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component.spec.ts` - 8 tests for SED Capable filter
- [x] `src/app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disks.component.spec.ts` - 3 tests for disk filtering
- [x] `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.component.spec.ts` - 3 tests for encryption display

### Files to Modify (Phase 4+)

**Components**:
- [ ] `src/app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component.ts` - Update pool creation payload

**Tests** (Phase 4+):
- [ ] `src/app/pages/storage/modules/pool-manager/components/pool-manager/tests/create-pool.spec.ts` - Integration tests for pool creation with SED

---

## Notes

- This implementation maintains backward compatibility with existing pool creation
- The prototype uses vanilla JavaScript; this implementation follows Angular best practices
- SED functionality already exists in TrueNAS for individual disk management; this extends it to pool creation
- Consider creating a feature flag if this needs to be rolled out gradually

### Phase 2 Implementation Notes (Completed 2025-10-15)

**Key Decisions Made:**
1. **No separate info/warning box components**: Used CSS classes (`.sed-info-message`, `.sed-global-password-warning`) instead for simplicity
2. **Enterprise check implemented**: SED option only appears for Enterprise licenses with SED-capable disks
3. **Password validation**: Used existing `matchOthersFgValidator` for password matching
4. **VDEVs to SED pools**: When adding VDEVs to SED pool, automatically set encryption type to SED (disabled) to ensure disk filtering
5. **Form reset behavior**: Resets to SED if available, None otherwise (smart defaults)
6. **Software encryption warning**: Existing dialog used when Software selected (no new dialog needed)

**Differences from Original Plan:**
- Simplified the warning dialog approach - kept existing software encryption warning dialog
- Did not implement separate info/warning box components - used CSS approach instead
- Added AsyncPipe import (required for template async observables)
- Removed IxCheckboxComponent import (replaced by radio group)

**Test Coverage:**
- 12 comprehensive tests covering all Phase 2 functionality
- All tests use proper harnesses (IxInputHarness, IxRadioGroupHarness, IxSelectHarness)
- Tests cover happy paths, validation, VDEVs, and form reset
- 100% pass rate on all Phase 2 tests

### Phase 3 Implementation Notes (Completed 2025-10-16)

**Key Decisions Made:**
1. **Inline badge approach**: Used inline `<span class="sed-badge">` instead of separate badge component for simplicity
2. **Manual Selection SED filter**: Added "SED Capable" checkbox that auto-checks and disables when SED encryption is active
3. **Review stage encryption**: Shows clear "Software (ZFS) - [algorithm]" or "Hardware (SED)" labels
4. **Data Step warning removed**: Initially implemented but removed based on user feedback - SED badge in Inventory is sufficient
5. **Dynamic password messages**: Show info (blue) when no password set, warning (yellow) when password exists
6. **Continuous inventory subscription**: Changed from take(1) to continuous subscription to react to encryption type changes

**Differences from Original Plan:**
- Did not create separate `DiskBadgeComponent` - used inline CSS badge approach instead
- Did not add Data Step warning - determined to be redundant with Inventory badge
- Added Review stage encryption indicator (not in original plan but requested by user)
- Added Manual Selection SED filter (not in original plan but requested by user)

**Additional Features Beyond Original Plan:**
1. **Manual Selection Dialog Enhancement**: Added SED Capable filter checkbox that:
   - Auto-checks and disables when SED encryption is selected
   - Allows manual filtering when no encryption or software encryption is selected
   - Properly filters disks using `isSedCapable()` utility function

2. **Review Stage Enhancement**: Added clear encryption type indicator showing:
   - "Software (ZFS) - aes-256-gcm" for software encryption
   - "Hardware (SED)" for SED encryption
   - No encryption row when encryption type is None

**Test Coverage:**
- 16 comprehensive tests covering all Phase 3 functionality
- All tests use proper harnesses (IxFormHarness, IxCheckboxHarness, TreeHarness)
- Tests cover encryption type display, SED badge visibility, and filtering logic
- 100% pass rate on all Phase 3 tests

**Technical Improvements:**
- Fixed inventory subscription to continuously react to encryption type changes
- Used `isSedCapable()` utility function consistently across all filtering logic
- Properly typed all new interfaces and parameters
- Maintained consistent CSS patterns with existing codebase
