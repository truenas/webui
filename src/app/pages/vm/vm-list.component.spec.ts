import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
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
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
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
  let table: IxTableHarness;
  let vmSubscriptionSubject$: Subject<unknown>;

  const createComponent = createComponentFactory({
    component: VmListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      IxTableColumnsSelectorComponent,
      FileSizePipe,
      IxTableDetailsRowDirective,
      MockComponent(VmWizardComponent),
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
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
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
      spectator.component.vmMap.set(vm.id, vm);
    });

    // Initialize the subscription by calling the method directly
    spectator.component.subscribeToVmEvents();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Running', 'Start on Boot'],
      ['test', '', ''],
      ['test_refactoring', '', ''],
      ['test_with_spice', '', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('opens vm wizard when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(VmWizardComponent);
  });

  describe('getDisplayPort', () => {
    it('returns "N/A" when display is not available', () => {
      const vm = virtualMachines[1]; // test_refactoring with display_available: false
      const result = spectator.component.getDisplayPort(vm);
      expect(result).toBe('N/A');
    });

    it('returns false when no devices exist', () => {
      const vm = { ...virtualMachines[0], devices: [] as VmDisplayDevice[] };
      const result = spectator.component.getDisplayPort(vm);
      expect(result).toBe(false);
    });

    it('returns false when no display devices exist', () => {
      const vm = {
        ...virtualMachines[0],
        devices: [] as VmDisplayDevice[],
      };
      const result = spectator.component.getDisplayPort(vm);
      expect(result).toBe(false);
    });

    it('returns VNC port for VNC display device', () => {
      const vm = virtualMachines[0]; // test with VNC display
      const result = spectator.component.getDisplayPort(vm);
      expect(result).toBe('VNC:5900');
    });

    it('returns SPICE port for SPICE display device', () => {
      const vm = virtualMachines[2]; // test_with_spice
      const result = spectator.component.getDisplayPort(vm);
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
      const result = spectator.component.getDisplayPort(vm);
      expect(result).toBe('VNC:5900, SPICE:5901');
    });
  });

  describe('subscribeToVmEvents', () => {
    it('should preserve devices when VM update does not include devices', () => {
      // Initial VM has devices
      const originalVm = virtualMachines[0];
      spectator.component.vmMap.set(originalVm.id, originalVm);

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

      const updatedVm = spectator.component.vmMap.get(originalVm.id);
      expect(updatedVm?.devices).toEqual(originalVm.devices);
      expect(updatedVm?.status?.state).toBe(VmState.Stopped);
    });

    it('should update devices when VM update includes devices', () => {
      const originalVm = virtualMachines[0];
      spectator.component.vmMap.set(originalVm.id, originalVm);

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

      const updatedVm = spectator.component.vmMap.get(originalVm.id);
      expect(updatedVm?.devices).toEqual(newDevices);
    });

    it('should add new VM to map when VM is added', () => {
      const newVm = {
        id: 999,
        name: 'new_vm',
        devices: [],
        display_available: false,
      } as VirtualMachine;

      vmSubscriptionSubject$.next({
        msg: CollectionChangeType.Added,
        id: newVm.id,
        fields: newVm,
      });

      expect(spectator.component.vmMap.get(newVm.id)).toEqual(newVm);
    });

    it('should remove VM from map when VM is removed', () => {
      const vmToRemove = virtualMachines[0];
      spectator.component.vmMap.set(vmToRemove.id, vmToRemove);

      vmSubscriptionSubject$.next({
        msg: CollectionChangeType.Removed,
        id: vmToRemove.id,
      });

      expect(spectator.component.vmMap.has(vmToRemove.id)).toBe(false);
    });
  });

  describe('getDisplayPortSortValue', () => {
    it('returns MAX_SAFE_INTEGER for VMs without display available', () => {
      const vm = virtualMachines[1]; // display_available: false
      const result = spectator.component.getDisplayPortSortValue(vm);
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

      const result = spectator.component.getDisplayPortSortValue(vm);
      expect(result).toBe(5900);
    });
  });
});
