import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnEmptyHarness, TnSelectHarness, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { VmBootloader, VmDeviceType, VmDisplayType, VmState } from 'app/enums/vm.enum';
import { ApiEventTyped } from 'app/interfaces/api-message.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import {
  TableColumnPickerComponent,
} from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
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
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  /**
   * Pushes a `vm.query` websocket event, the same path production uses to learn a VM was added,
   * changed or removed. Preferred over seeding the component's row map directly: it also covers
   * the subscription that maintains it, and keeps these cases off the component's internals.
   */
  function emitVmEvent(event: Partial<ApiEventTyped>): void {
    spectator.inject(MockApiService).emitSubscribeEvent(event as ApiEventTyped);
    spectator.detectChanges();
  }

  /**
   * Reveals a column the picker hides by default, so the cell it renders can be asserted on. The
   * picker is a multiselect, so selecting adds to the visible set rather than replacing it.
   */
  async function showColumn(title: string): Promise<void> {
    const picker = await loader.getHarness(TnSelectHarness);
    await picker.selectOption(title);
    await picker.close();
    spectator.detectChanges();
  }

  async function getNames(): Promise<string[]> {
    const rows = await table.getAllRowTexts();
    return rows.map((cells) => cells[0]);
  }

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

  describe('Display Port column', () => {
    beforeEach(async () => {
      await showColumn('Display Port');
    });

    it('renders a port per display device, and N/A where display is unavailable', async () => {
      expect(await table.getCellText(0, 'display_port')).toBe('VNC:5900');
      expect(await table.getCellText(1, 'display_port')).toBe('N/A');
      expect(await table.getCellText(2, 'display_port')).toBe('SPICE:5901');
    });

    it('lists every display device a VM has', async () => {
      emitVmEvent({
        msg: CollectionChangeType.Changed,
        id: virtualMachines[0].id,
        fields: {
          id: virtualMachines[0].id,
          devices: [
            { attributes: { dtype: VmDeviceType.Display, type: VmDisplayType.Vnc, port: 5900 } },
            { attributes: { dtype: VmDeviceType.Display, type: VmDisplayType.Spice, port: 5901 } },
          ] as VmDisplayDevice[],
        },
      });

      expect(await table.getCellText(0, 'display_port')).toBe('VNC:5900, SPICE:5901');
    });

    // Covers `sortAccessors`: the cells are derived text, so sorting them as rendered would
    // order 'N/A' < 'SPICE:5901' < 'VNC:5900'. The accessor sorts by the lowest port instead,
    // with the VMs that have no port pushed to the end.
    it('sorts by the lowest port number rather than by the rendered text', async () => {
      // Ports deliberately out of order: taking the first (5902) rather than the lowest (5900)
      // would drop this VM behind test_with_spice's 5901.
      emitVmEvent({
        msg: CollectionChangeType.Changed,
        id: virtualMachines[0].id,
        fields: {
          id: virtualMachines[0].id,
          devices: [
            { attributes: { dtype: VmDeviceType.Display, type: VmDisplayType.Vnc, port: 5902 } },
            { attributes: { dtype: VmDeviceType.Display, type: VmDisplayType.Vnc, port: 5900 } },
            { attributes: { dtype: VmDeviceType.Display, type: VmDisplayType.Vnc, port: 5901 } },
          ] as VmDisplayDevice[],
        },
      });

      await table.clickSortHeader('display_port');
      spectator.detectChanges();

      expect(await getNames()).toEqual(['test', 'test_with_spice', 'test_refactoring']);
    });
  });

  describe('vm.query subscription', () => {
    it('adds a row when a VM is added', async () => {
      emitVmEvent({
        msg: CollectionChangeType.Added,
        id: 999,
        fields: {
          id: 999,
          name: 'new_vm',
          devices: [],
          display_available: false,
          status: { state: VmState.Stopped, pid: null, domain_state: 'SHUTOFF' },
          autostart: false,
          bootloader: VmBootloader.Uefi,
        } as VirtualMachine,
      });

      expect(await getNames()).toEqual(['test', 'test_refactoring', 'test_with_spice', 'new_vm']);
    });

    it('drops the row when a VM is removed', async () => {
      emitVmEvent({ msg: CollectionChangeType.Removed, id: virtualMachines[0].id });

      expect(await getNames()).toEqual(['test_refactoring', 'test_with_spice']);
    });

    // Regression: a state-change event carries no `devices`, and merging it naively over the
    // cached VM would blank the Display Port cell for as long as the list stays open.
    it('applies a partial update without losing the devices it omits', async () => {
      await showColumn('Display Port');

      emitVmEvent({
        msg: CollectionChangeType.Changed,
        id: virtualMachines[0].id,
        fields: { id: virtualMachines[0].id, status: { state: VmState.Stopped } },
      });

      expect(await table.getCellText(0, 'display_port')).toBe('VNC:5900');

      const running = await loader.getHarness(TnSlideToggleHarness.with({
        testId: 'toggle-running-virtual-machine-test-row-toggle',
      }));
      expect(await running.isChecked()).toBe(false);
    });

    it('applies the devices an update does carry', async () => {
      await showColumn('Display Port');

      emitVmEvent({
        msg: CollectionChangeType.Changed,
        id: virtualMachines[0].id,
        fields: {
          id: virtualMachines[0].id,
          devices: [
            { id: 3, attributes: { dtype: VmDeviceType.Display, type: VmDisplayType.Spice, port: 5999 } },
          ] as VmDisplayDevice[],
        },
      });

      expect(await table.getCellText(0, 'display_port')).toBe('SPICE:5999');
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
