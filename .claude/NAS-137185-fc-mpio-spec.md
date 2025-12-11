# FC MPIO (Fibre Channel Multipath I/O) Implementation Specification

**Ticket:** NAS-137185
**Related Middleware Ticket:** NAS-137249
**Middleware Commit:** 23158f7527ebe09c10e6b1d70c01a224a8f0de69

## Overview
Add support for mapping a Fibre Channel target to multiple FC ports for Multipath I/O. The middleware already supports this with the constraint that each port must be on a different physical HBA.

## ⚠️ PHASED IMPLEMENTATION APPROACH

**To minimize regression risk, this will be implemented in carefully validated phases:**

1. **Phase 1: Service Layer** - Update backend service methods + comprehensive unit tests
2. **Phase 2: Display Components** - Update read-only display of ports (low risk)
3. **Phase 3: New Port Controls Component** - Build new component in isolation with tests
4. **Phase 4: Target Form Integration** - Replace single FC form with array (higher risk)
5. **Phase 5: Integration Testing** - End-to-end validation + backward compatibility testing

**Each phase must be fully tested and validated before proceeding to the next.**

### Risk Assessment
- **iSCSI Regression Risk**: VERY LOW (completely separate code paths)
- **Existing FC Behavior Risk**: MEDIUM (significant refactor, mitigated by phased approach)
- **Mitigation**: Incremental changes with validation gates between phases

## Background

### Current State
- **iSCSI**: Already supports MPIO via a "groups" array where each group = one path
- **FC**: Currently limited to ONE port per target via single `fcForm` FormGroup
- **Middleware**: Now supports multiple FC ports per target with validation

### Validation Rules (Middleware enforces)
- ✅ Valid: `fc0` AND `fc1` (different physical HBAs)
- ✅ Valid: `fc0` AND `fc1/3` (different physical HBAs, fc1/3 is NPIV virtual port)
- ❌ Invalid: `fc0` AND `fc0/1` (same physical HBA fc0)
- ❌ Invalid: `fc1/2` AND `fc1/3` (same physical HBA fc1)

## Implementation Strategy

Follow the proven iSCSI groups pattern: replace single `fcForm` with `fcPorts: FormArray` where each array item represents one FC port path.

## Changes Required

### 1. Service Layer (`fibre-channel.service.ts`)

**Current:**
```typescript
loadTargetPort(targetId: number): Observable<FibreChannelPort | undefined> {
  return this.api.call('fcport.query', [[['target.id', '=', targetId]]]).pipe(
    map((ports) => ports[0]),  // ❌ Only returns first port
  );
}
```

**Changes:**
1. **Rename** `loadTargetPort()` → `loadTargetPorts()`
   - Return type: `Observable<FibreChannelPort[]>` (remove the `map((ports) => ports[0])`)

2. **Add validation helper:**
```typescript
validatePhysicalHbaUniqueness(ports: FcPortFormValue[]): { valid: boolean; duplicates: string[] } {
  // Extract physical HBA: split on '/' and take first part
  // Example: "fc0/1" → "fc0", "fc1" → "fc1"
  // Return { valid: false, duplicates: ['fc0'] } if same HBA used twice
}
```

3. **Update** `linkFiberChannelToTarget()` → `linkFiberChannelPortsToTarget()`
   - Accept array: `ports: FcPortFormValue[]`
   - Logic:
     - Query existing ports for target
     - Compare desired vs existing
     - Delete removed ports
     - Create new ports
     - Use `forkJoin` for parallel operations
     - Handle virtual port creation (`host_id` → port string resolution)

### 2. Target Form Component (`target-form.component.ts`)

**Current (lines 164-167):**
```typescript
fcForm = this.formBuilder.group({
  port: new FormControl(null as string | null),
  host_id: new FormControl(null as number | null, [Validators.required]),
});
```

**Replace with FormArray:**
```typescript
fcPorts = this.formBuilder.array<FormGroup<{
  port: FormControl<string | null>;
  host_id: FormControl<number | null>;
}>>();
```

**Add methods:**
- `addFcPort()` - Add new port to array
- `deleteFcPort(index)` - Remove port from array
- `validateFcPorts()` - Client-side validation for HBA uniqueness

**Update `loadFibreChannelPort()` → `loadFibreChannelPorts()`:**
- Call `fcService.loadTargetPorts(targetId)` (returns array)
- Clear `fcPorts` array
- Populate array with existing ports

**Update `onSubmit()`:**
- Call `fcService.linkFiberChannelPortsToTarget(targetId, this.fcPorts.getRawValue())`

**Update properties:**
- `editingTargetPort: string` → `editingTargetPorts: string[]`

### 3. Target Form Template (`target-form.component.html`)

**Current (lines 57-63):**
```html
@if (showPortControls) {
  <ix-fc-ports-controls
    [form]="fcForm"
    [isEdit]="!isNew"
    [currentPort]="editingTargetPort"
  ></ix-fc-ports-controls>
}
```

**Replace with ix-list (similar to iSCSI groups pattern on lines 68-113):**
```html
@if (showPortControls) {
  <ix-list
    [empty]="fcPorts.length === 0"
    [label]="'Fibre Channel Ports' | translate"
    [formArray]="fcPorts"
    (add)="addFcPort()"
  >
    @for (entry of fcPorts.controls; track entry; let i = $index) {
      <ix-list-item
        [label]="'Port' | translate"
        (delete)="deleteFcPort(i)"
      >
        <ix-fc-port-item-controls
          [form]="fcPorts.at(i)"
          [isEdit]="!isNew"
          [currentPort]="editingTargetPorts?.[i]"
        ></ix-fc-port-item-controls>
      </ix-list-item>
    }
  </ix-list>

  @if (fcPortValidationErrors().length > 0) {
    <mat-error>
      {{ fcPortValidationErrors().join(', ') }}
    </mat-error>
  }
}
```

**Update Save button (line 124):**
```html
[disabled]="form.invalid || (showPortControls && !areFcPortsValid()) || isLoading() || isAsyncValidatorPending"
```

### 4. New Component: FC Port Item Controls

**Create:** `fc-port-item-controls.component.ts`

Simplified component for use in list context (no radio buttons):
- **Mode selector dropdown**: "Use Existing Port" | "Create New Virtual Port"
- **Conditional control**: Show port selector OR host selector based on mode
- **Props:**
  - `form` - The FormGroup for this port item
  - `isEdit` - Whether editing existing target
  - `currentPort` - The port string if editing

**Template structure:**
```html
<ix-select formControl="modeControl" [label]="'Port Mode'">
  <!-- Options: existing | new -->
</ix-select>

@if (modeControl.value === 'new') {
  <ix-select formControlName="host_id" [label]="'Choose a new virtual port'" />
} @else if (modeControl.value === 'existing') {
  <ix-select formControlName="port" [label]="'Existing Ports'" />
}
```

### 5. Target Details Component (`target-details.component.ts`)

**Update signal:**
```typescript
// OLD
targetPort = signal<FibreChannelPort | null>(null);

// NEW
targetPorts = signal<FibreChannelPort[]>([]);
```

**Update query method:**
```typescript
private getPortsByTargetId(id: number): void {
  this.api.call('fcport.query', [[['target.id', '=', id]]])
    .pipe(...)
    .subscribe((ports) => {
      this.targetPorts.set(ports); // Return full array
    });
}
```

### 6. FC Port Card Component (`fibre-channel-port-card.component.ts`)

**Rename component:** `FibreChannelPortsCardComponent` (plural)

**Update input:**
```typescript
readonly ports = input.required<FibreChannelPort[]>(); // Array
```

**Update template:**
```html
@for (port of ports(); track port.id) {
  <div class="port-group">
    <h4>{{ port.port }}</h4>
    <p>WWPN: {{ port.wwpn }}</p>
    <p>WWPN B: {{ port.wwpn_b }}</p>
  </div>
} @empty {
  <p>No associated Fibre Channel ports.</p>
}
```

## Phased Implementation Plan

### Phase 1: Service Layer Foundation 🔧
**Goal:** Update service methods to handle arrays without breaking existing single-port behavior.

**Changes:**
1. Update `fibre-channel.service.ts`:
   - Rename `loadTargetPort()` → `loadTargetPorts()` (returns array)
   - Add `validatePhysicalHbaUniqueness()` helper
   - Add `linkFiberChannelPortsToTarget()` (handles arrays)
   - **Keep old method temporarily** for backward compatibility testing

2. **Write comprehensive unit tests:**
   - `loadTargetPorts()` with 0, 1, N ports
   - `validatePhysicalHbaUniqueness()` catches duplicate HBAs
   - `linkFiberChannelPortsToTarget()`:
     - Creates multiple new ports
     - Deletes removed ports
     - Updates existing ports
     - Handles edge cases (0→0, 0→1, 1→0, 1→1, 1→N)
     - Virtual port creation (host_id resolution)

**Validation Gate:**
- ✅ All service unit tests pass
- ✅ Run `yarn test src/app/services/fibre-channel.service.spec.ts`
- ✅ No changes to any UI code yet

---

### Phase 2: Display Components (Read-Only) 📊
**Goal:** Update display of FC ports to show arrays. Low risk since no form logic involved.

**Changes:**
1. Update `target-details.component.ts`:
   - Change `targetPort` signal to `targetPorts` (array)
   - Update query to use new service method
   - Pass array to card component

2. Rename `fibre-channel-port-card.component.ts` → `fibre-channel-ports-card.component.ts`:
   - Update input from single port to array
   - Update template to loop over ports with `@for`
   - Handle empty state

3. **Update tests:**
   - Display component shows multiple ports correctly
   - Empty state shows appropriate message
   - Single port backward compatibility

**Validation Gate:**
- ✅ Display tests pass
- ✅ Manually test viewing existing single-port target (backward compat)
- ✅ Manually test viewing target with no ports
- ✅ Run `yarn test:changed`

---

### Phase 3: New Port Item Controls Component 🆕
**Goal:** Build new simplified component for use in list items. Test in isolation.

**Changes:**
1. Create `fc-port-item-controls.component.ts`:
   - Mode selector (existing vs new virtual port)
   - Conditional port/host_id controls
   - Form control enable/disable logic
   - Edit mode with currentPort prefill

2. Create component template

3. **Write comprehensive component tests:**
   - Mode switching enables/disables correct controls
   - Port options load correctly
   - Host options load correctly
   - Edit mode prefills correctly
   - Validators work as expected

**Validation Gate:**
- ✅ All component tests pass
- ✅ Component works in isolation (test harness)
- ✅ No integration with target form yet

---

### Phase 4: Target Form Integration ⚠️ (HIGH RISK)
**Goal:** Replace single `fcForm` with `fcPorts` FormArray. Most critical phase.

**Changes:**
1. Update `target-form.component.ts`:
   - Replace `fcForm: FormGroup` with `fcPorts: FormArray`
   - Add `addFcPort()`, `deleteFcPort()`, `validateFcPorts()`
   - Update `loadFibreChannelPorts()` to populate array
   - Update `onSubmit()` to call new service method
   - Add validation logic

2. Update `target-form.component.html`:
   - Replace `<ix-fc-ports-controls>` with `<ix-list>`
   - Use new `<ix-fc-port-item-controls>` component
   - Add validation error display
   - Update Save button disabled logic

3. **Critical backward compatibility tests:**
   - ✅ Edit existing target with 1 port → loads correctly
   - ✅ Edit existing target with 1 port → save without changes (no-op)
   - ✅ Edit existing target with 1 port → add second port
   - ✅ Edit existing target with 1 port → remove port (0 ports)
   - ✅ Create new target with 0 ports
   - ✅ Create new target with 1 port
   - ✅ Create new target with 2+ ports
   - ✅ Validation error handling (duplicate HBA)
   - ✅ iSCSI target creation still works (no FC involvement)

4. **Update form tests:**
   - All above scenarios as unit/integration tests
   - Mock service responses appropriately

**Validation Gate:**
- ✅ All target form tests pass
- ✅ **Manual testing on local environment**
- ✅ Verify iSCSI targets (mode=ISCSI) completely unaffected
- ✅ Verify FC targets (mode=FC) work with 0, 1, N ports
- ✅ Verify BOTH mode targets work correctly
- ✅ Run `yarn test:changed`
- ✅ No TypeScript errors: `yarn build`

---

### Phase 5: End-to-End Integration Testing 🧪
**Goal:** Comprehensive validation across the entire feature.

**Test Scenarios:**

**Backward Compatibility (Critical):**
1. Edit existing single-port FC target:
   - Should load with 1 item in array
   - Should display correctly
   - Should save without changes (no API calls)
   - Should allow adding more ports
   - Should allow removing the port

2. View existing single-port target:
   - Display should show the port
   - No errors in console

**New Functionality:**
3. Create multi-port FC target:
   - Add multiple ports on different HBAs
   - Save successfully
   - Verify all ports created in backend

4. Edit multi-port target:
   - Load shows all ports
   - Can add more ports
   - Can remove ports
   - Can change ports

**Validation:**
5. Client-side validation:
   - Warning when selecting same HBA twice
   - Cannot submit with duplicate HBAs

6. Backend validation:
   - Backend rejects duplicate HBA
   - Error displayed correctly on form

**Regression Testing:**
7. iSCSI targets (mode=ISCSI):
   - Create new target with groups
   - Edit existing target
   - Verify no FC fields shown
   - Verify groups work correctly

8. Mixed mode (mode=BOTH):
   - Create target with both iSCSI groups and FC ports
   - Edit existing mixed target
   - Verify both work independently

**Validation Gate:**
- ✅ All scenarios above pass manually
- ✅ Run full test suite: `yarn test:changed`
- ✅ Build succeeds: `yarn build`
- ✅ Lint passes: `yarn lint src/app/services/fibre-channel.service.ts src/app/pages/sharing/iscsi/**`
- ✅ **Code review with team member**

## Critical Files

### Must Modify:
1. `/Users/aaronervin/Projects/webui/src/app/services/fibre-channel.service.ts`
2. `/Users/aaronervin/Projects/webui/src/app/pages/sharing/iscsi/target/target-form/target-form.component.ts`
3. `/Users/aaronervin/Projects/webui/src/app/pages/sharing/iscsi/target/target-form/target-form.component.html`
4. `/Users/aaronervin/Projects/webui/src/app/pages/sharing/iscsi/target/all-targets/target-details/target-details.component.ts`
5. `/Users/aaronervin/Projects/webui/src/app/pages/sharing/iscsi/target/all-targets/target-details/fibre-channel-port-card/fibre-channel-port-card.component.ts`
6. `/Users/aaronervin/Projects/webui/src/app/pages/sharing/iscsi/target/all-targets/target-details/fibre-channel-port-card/fibre-channel-port-card.component.html`

### Must Create:
1. `/Users/aaronervin/Projects/webui/src/app/pages/sharing/iscsi/fibre-channel-ports/fc-port-item-controls/fc-port-item-controls.component.ts`
2. `/Users/aaronervin/Projects/webui/src/app/pages/sharing/iscsi/fibre-channel-ports/fc-port-item-controls/fc-port-item-controls.component.html`
3. `/Users/aaronervin/Projects/webui/src/app/pages/sharing/iscsi/fibre-channel-ports/fc-port-item-controls/fc-port-item-controls.component.spec.ts`

### Update Tests:
1. `/Users/aaronervin/Projects/webui/src/app/services/fibre-channel.service.spec.ts`
2. `/Users/aaronervin/Projects/webui/src/app/pages/sharing/iscsi/target/target-form/target-form.component.spec.ts`

## Edge Cases

1. **Editing target with single port** (backward compatibility)
   - Query returns array with 1 item
   - Form populates array with that item
   - User can add more ports

2. **Empty ports (DoNotConnect)**
   - Empty array is valid = no FC connections
   - Service deletes all existing port mappings

3. **Backend validation error** (same physical HBA)
   - Client-side validation warns before submit
   - Backend error displayed on specific port control
   - User can correct without losing form data

4. **NPIV port creation race condition**
   - Service resolves `host_id` → port string at submit time
   - Uses latest NPIV count from middleware

## Testing Strategy

**Unit Tests:**
- Service: `validatePhysicalHbaUniqueness()` detects duplicates
- Service: `linkFiberChannelPortsToTarget()` creates/deletes correctly
- Form: Add/delete ports updates array
- Form: Validation shows errors for duplicate HBAs
- Component: FC port item controls mode switching

**Integration Tests:**
- Form submission with multiple ports calls correct API
- Edit loads existing ports into array
- Display shows all ports

**Manual QA:**
- Test with mock data (no real FC hardware needed)
- Verify validation messages
- Test backward compatibility (edit old single-port targets)

## Validation Logic

**Physical HBA Extraction:**
```typescript
// "fc0" → "fc0"
// "fc0/1" → "fc0" (split on '/' and take first part)
// "fc1/3" → "fc1"
const physicalHba = portString.split('/')[0];
```

**Validation:**
- Client-side: Check for duplicate physical HBAs before submit
- Warning message: "The following physical HBAs are used multiple times: fc0. Each port must be on a different physical HBA."
- Backend: Middleware performs final validation

## Backward Compatibility Strategy

### How Existing Single-Port Targets Work

**Query Phase:**
```typescript
// Old: fcport.query returns [port1]
// Old service: map((ports) => ports[0]) → returns single port
// New service: returns [port1] (array)
```

**Form Load:**
```typescript
loadFibreChannelPorts() {
  this.fcService.loadTargetPorts(targetId).subscribe((ports) => {
    ports.forEach(port => {
      this.addFcPort();  // Create FormGroup
      this.fcPorts.at(index).patchValue({ port: port.port });
    });
  });
}
// Result: fcPorts.length = 1, user sees one port, can add more
```

**Save Without Changes:**
```typescript
// Desired: [port1]
// Existing: [port1]
// Service: No create/delete operations, returns early
```

**Add Second Port:**
```typescript
// Desired: [port1, port2]
// Existing: [port1]
// Service: Creates port2, keeps port1
```

**Remove Port:**
```typescript
// Desired: []
// Existing: [port1]
// Service: Deletes port1
```

### Critical Safety Checks

**Before submitting PR:**
1. ✅ Test with actual existing single-port target in development
2. ✅ Verify no unintended fcport.delete calls
3. ✅ Verify iSCSI groups completely unaffected
4. ✅ Database queries - no N+1 issues with multiple ports

## Notes

- **Pattern consistency**: Follows proven iSCSI groups pattern (ix-list with FormArray)
- **Backward compatible**: Works with existing single-port targets (array.length = 1)
- **No breaking changes**: Empty array = "Do not connect" (equivalent to old behavior)
- **Keep existing component**: Don't modify `fc-ports-controls.component.ts` - create new simplified component
- **iSCSI isolation**: FC code only executes when `showPortControls` is true (mode=FC or BOTH)
- **Phased approach**: Each phase validated independently before proceeding
