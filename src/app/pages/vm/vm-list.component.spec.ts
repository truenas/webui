import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnEmptyHarness, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { VmBootloader, VmDeviceType, VmDisplayType, VmState } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import {
  TableColumnPickerComponent,
} from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  VirtualMachineDetailsRowComponent,
} from 'app/pages/vm/vm-list/vm-details-row/vm-details-row.component';
import { VmListComponent } from 'app/pages/vm/vm-list.component';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { VmService } from 'app/services/vm.service';

const virtualMachines = [
  {
    id: 2,
    name: 'test',
    autostart: true,
    status: {
      state: VmState.Running,
      pid: 12028,
      domain_state: 'RUNNING',
    },
    display_available: true,
    devices: [
      {
        id: 1,
        attributes: {
          dtype: VmDeviceType.Display,
          type: VmDisplayType.Vnc,
          port: 5900,
        },
      },
    ] as VmDisplayDevice[],
    bootloader: VmBootloader.Uefi,
  },
  {
    id: 3,
    name: 'test_refactoring',
    autostart: false,
    status: {
      state: VmState.Stopped,
      pid: null,
      domain_state: 'SHUTOFF',
    },
    display_available: false,
    devices: [],
    bootloader: VmBootloader.Uefi,
  },
  {
    id: 4,
    name: 'test_with_spice',
    autostart: true,
    status: {
      state: VmState.Running,
      pid: 12029,
      domain_state: 'RUNNING',
    },
    display_available: true,
    devices: [
      {
        id: 2,
        attributes: {
          dtype: VmDeviceType.Display,
          type: VmDisplayType.Spice,
          port: 5901,
        },
      },
    ] as VmDisplayDevice[],
    bootloader: VmBootloader.Uefi,
  },
] as VirtualMachine[];

describe('VmListComponent', () => {
  let spectator: Spectator<VmListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  let vmSubscriptionSubject$: Subject<unknown>;

  // The members below are template-facing (`protected`) or component-internal (`private`).
  // These typed accessors keep the pure-logic cases below unit-testable without a
  // bracket-access suppression at every one of their ~15 call sites.
  /* eslint-disable @typescript-eslint/dot-notation */
  const getDisplayPort = (vm: VirtualMachine): boolean | number | string => spectator.component['getDisplayPort'](vm);
  const getDisplayPortSortValue = (vm: VirtualMachine): number => spectator.component['getDisplayPortSortValue'](vm);
  const vmMap = (): Map<string | number, VirtualMachine> => spectator.component['vmMap'];
  const subscribeToVmEvents = (): void => spectator.component['subscribeToVmEvents']();
  /* eslint-enable @typescript-eslint/dot-notation */

  const createComponent = createComponentFactory({
    component: VmListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      TableColumnPickerComponent,
      FileSizePipe,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('vm.query', virtualMachines),
      ]),
      provideMockStore({
        initialState: {
          preferences: {
            preferences: {
              vmList: {},
            },
          },
          systemInfo: {
            systemInfo: null,
            productType: ProductType.CommunityEdition,
            isIxHardware: false,
            buildYear: 2024,
          },
        },
      }),
      mockProvider(SystemGeneralService),
      mockProvider(VmService, {
        getAvailableMemory: jest.fn(() => of(4096)),
        hasVirtualizationSupport$: of(true),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
    ],
  });

  beforeEach(async () => {
    vmSubscriptionSubject$ = new Subject();

    spectator = createComponent();

    // Mock the subscribe method after component creation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(spectator.inject(ApiService), 'subscribe').mockImplementation((): any => {
      return vmSubscriptionSubject$.asObservable();
    });

    // Initialize the vmMap with test data
    virtualMachines.forEach((vm) => {
      vmMap().set(vm.id, vm);
    });

    // Initialize the subscription by calling the method directly
    subscribeToVmEvents();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', 'Running', 'Start on Boot']);
    expect(await table.getAllRowTexts()).toEqual([
      ['test', '', ''],
      ['test_refactoring', '', ''],
      ['test_with_spice', '', ''],
    ]);
  });

  it('opens vm wizard when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(VmWizardComponent, {
      title: 'Create Virtual Machine',
      wide: true,
      footerless: true,
    });
  });

  describe('row expansion', () => {
    it('expands a row into the VM details row on click', async () => {
      expect(await table.isRowExpanded(0)).toBe(false);

      await table.clickRow(0);

      expect(await table.isRowExpanded(0)).toBe(true);
      expect(spectator.query(VirtualMachineDetailsRowComponent)).toBeTruthy();
    });

    it('keeps only one row expanded at a time', async () => {
      await table.clickRow(0);
      await table.clickRow(1);

      expect(await table.getExpandedRowCount()).toBe(1);
      expect(await table.isRowExpanded(0)).toBe(false);
      expect(await table.isRowExpanded(1)).toBe(true);
    });
  });

  describe('toggle columns', () => {
    /**
     * Addresses a toggle by its resolved test ID rather than by position in
     * `getAllHarnesses` — with two toggle columns per row, a positional lookup silently
     * follows a column reorder onto the wrong switch.
     */
    function getToggle(column: 'running' | 'start-on-boot', vmName: string): Promise<TnSlideToggleHarness> {
      return loader.getHarness(TnSlideToggleHarness.with({
        testId: `toggle-${column}-virtual-machine-${vmName.replace(/_/g, '-')}-row-toggle`,
      }));
    }

    it('reflects VM running and autostart state', async () => {
      expect(await (await getToggle('running', 'test')).isChecked()).toBe(true);
      expect(await (await getToggle('start-on-boot', 'test')).isChecked()).toBe(true);
      expect(await (await getToggle('running', 'test_refactoring')).isChecked()).toBe(false);
      expect(await (await getToggle('start-on-boot', 'test_refactoring')).isChecked()).toBe(false);
    });

    it('reverts the Running toggle when the stop dialog is cancelled', async () => {
      // Answer through a Subject rather than of(false) so the flip is optimistic first and the
      // revert lands afterwards — the same ordering as the real confirmation dialog.
      const stopConfirmed$ = new Subject<boolean>();
      jest.spyOn(spectator.inject(VmService), 'doStop').mockReturnValue(stopConfirmed$.asObservable());

      const toggle = await getToggle('running', 'test');
      await toggle.uncheck();

      expect(spectator.inject(VmService).doStop).toHaveBeenCalledWith(virtualMachines[0]);
      expect(await toggle.isChecked()).toBe(false);

      stopConfirmed$.next(false);
      spectator.detectChanges();

      expect(await toggle.isChecked()).toBe(true);
    });

    it('reverts the Start on Boot toggle when the update fails', async () => {
      const autostartUpdated$ = new Subject<boolean>();
      jest.spyOn(spectator.inject(VmService), 'toggleVmAutostart').mockReturnValue(autostartUpdated$.asObservable());

      const toggle = await getToggle('start-on-boot', 'test');
      await toggle.uncheck();

      expect(spectator.inject(VmService).toggleVmAutostart).toHaveBeenCalledWith(virtualMachines[0]);

      autostartUpdated$.next(false);
      spectator.detectChanges();

      expect(await toggle.isChecked()).toBe(true);
    });

    // Regression: the table is [clickable], and its row handler preventDefaults Enter/Space
    // for any keydown that reaches it — which would cancel the checkbox's own Space
    // activation and expand the row instead of flipping the switch.
    it('does not let Space on a toggle reach the clickable row', async () => {
      // White-box: no harness can express this. `TestElement.dispatchEvent` does not hand the
      // event back, so `defaultPrevented` is unreachable through the abstraction — the raw
      // element is the only way to observe it. Scoped to the cell so it can't match elsewhere.
      const toggleInput = spectator.query('ix-table-toggle-cell input');
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      toggleInput.dispatchEvent(event);
      spectator.detectChanges();

      expect(event.defaultPrevented).toBe(false);
      expect(await table.getExpandedRowCount()).toBe(0);
    });
  });

  describe('getDisplayPort', () => {
    it('returns "N/A" when display is not available', () => {
      const vm = virtualMachines[1]; // test_refactoring with display_available: false
      const result = getDisplayPort(vm);
      expect(result).toBe('N/A');
    });

    it('returns false when no devices exist', () => {
      const vm = { ...virtualMachines[0], devices: [] as VmDisplayDevice[] };
      const result = getDisplayPort(vm);
      expect(result).toBe(false);
    });

    it('returns false when no display devices exist', () => {
      const vm = {
        ...virtualMachines[0],
        devices: [] as VmDisplayDevice[],
      };
      const result = getDisplayPort(vm);
      expect(result).toBe(false);
    });

    it('returns VNC port for VNC display device', () => {
      const vm = virtualMachines[0]; // test with VNC display
      const result = getDisplayPort(vm);
      expect(result).toBe('VNC:5900');
    });

    it('returns SPICE port for SPICE display device', () => {
      const vm = virtualMachines[2]; // test_with_spice
      const result = getDisplayPort(vm);
      expect(result).toBe('SPICE:5901');
    });

    it('returns multiple ports when multiple display devices exist', () => {
      const vm = {
        ...virtualMachines[0],
        devices: [
          {
            attributes: {
              dtype: VmDeviceType.Display,
              type: VmDisplayType.Vnc,
              port: 5900,
            },
          },
          {
            attributes: {
              dtype: VmDeviceType.Display,
              type: VmDisplayType.Spice,
              port: 5901,
            },
          },
        ] as VmDisplayDevice[],
      };
      const result = getDisplayPort(vm);
      expect(result).toBe('VNC:5900, SPICE:5901');
    });
  });

  describe('subscribeToVmEvents', () => {
    it('should preserve devices when VM update does not include devices', () => {
      // Initial VM has devices
      const originalVm = virtualMachines[0];
      vmMap().set(originalVm.id, originalVm);

      // Simulate a partial update without devices (like a state change)
      const partialUpdate = {
        id: originalVm.id,
        status: { state: VmState.Stopped },
      };

      vmSubscriptionSubject$.next({
        msg: CollectionChangeType.Changed,
        id: originalVm.id,
        fields: partialUpdate,
      });

      const updatedVm = vmMap().get(originalVm.id);
      expect(updatedVm?.devices).toEqual(originalVm.devices);
      expect(updatedVm?.status?.state).toBe(VmState.Stopped);
    });

    it('should update devices when VM update includes devices', () => {
      const originalVm = virtualMachines[0];
      vmMap().set(originalVm.id, originalVm);

      const newDevices = [
        {
          id: 3,
          attributes: {
            dtype: VmDeviceType.Display,
            type: VmDisplayType.Spice,
            port: 5999,
          },
        },
      ] as VmDisplayDevice[];

      const updateWithDevices = {
        id: originalVm.id,
        devices: newDevices,
        status: originalVm.status,
      };

      vmSubscriptionSubject$.next({
        msg: CollectionChangeType.Changed,
        id: originalVm.id,
        fields: updateWithDevices,
      });

      const updatedVm = vmMap().get(originalVm.id);
      expect(updatedVm?.devices).toEqual(newDevices);
    });

    it('should add new VM to map when VM is added', () => {
      const newVm = {
        id: 999,
        name: 'new_vm',
        devices: [],
        display_available: false,
        status: {
          state: VmState.Stopped,
          pid: null,
          domain_state: 'SHUTOFF',
        },
        autostart: false,
        bootloader: VmBootloader.Uefi,
      } as VirtualMachine;

      vmSubscriptionSubject$.next({
        msg: CollectionChangeType.Added,
        id: newVm.id,
        fields: newVm,
      });

      expect(vmMap().get(newVm.id)).toEqual(newVm);
    });

    it('should remove VM from map when VM is removed', () => {
      const vmToRemove = virtualMachines[0];
      vmMap().set(vmToRemove.id, vmToRemove);

      vmSubscriptionSubject$.next({
        msg: CollectionChangeType.Removed,
        id: vmToRemove.id,
      });

      expect(vmMap().has(vmToRemove.id)).toBe(false);
    });
  });

  describe('getDisplayPortSortValue', () => {
    it('returns MAX_SAFE_INTEGER for VMs without display available', () => {
      const vm = virtualMachines[1]; // display_available: false
      const result = getDisplayPortSortValue(vm);
      expect(result).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('returns lowest port number for sorting when multiple display devices exist', () => {
      const vm = {
        ...virtualMachines[0],
        devices: [
          { attributes: { dtype: VmDeviceType.Display, port: 5902 } },
          { attributes: { dtype: VmDeviceType.Display, port: 5900 } },
          { attributes: { dtype: VmDeviceType.Display, port: 5901 } },
        ] as VmDisplayDevice[],
      };

      const result = getDisplayPortSortValue(vm);
      expect(result).toBe(5900);
    });
  });
});

describe('VmListComponent without virtualization support', () => {
  let spectator: Spectator<VmListComponent>;
  let loader: HarnessLoader;

  // Own factory rather than a per-test provider override: `hasVirtualizationSupport` is read
  // into a signal in a field initializer, so the provider has to be in place at construction.
  const createComponent = createComponentFactory({
    component: VmListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      TableColumnPickerComponent,
      FileSizePipe,
    ],
    providers: [
      mockAuth(),
      mockApi([mockCall('vm.query', [])]),
      provideMockStore({
        initialState: {
          preferences: { preferences: { vmList: {} } },
          systemInfo: {
            systemInfo: null,
            productType: ProductType.CommunityEdition,
            isIxHardware: false,
            buildYear: 2024,
          },
        },
      }),
      mockProvider(SystemGeneralService),
      mockProvider(VmService, {
        getAvailableMemory: jest.fn(() => of(4096)),
        hasVirtualizationSupport$: of(false),
      }),
      mockProvider(FormSidePanelService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders the unsupported empty state instead of the table', async () => {
    expect(await loader.getAllHarnesses(TnTableHarness)).toHaveLength(0);

    const empty = await loader.getHarness(TnEmptyHarness);
    expect(await empty.getTitle()).toBe('Virtualization is not supported');
  });
});
