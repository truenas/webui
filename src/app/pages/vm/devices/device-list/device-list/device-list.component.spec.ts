import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnDialog, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VmDeviceType, VmDiskMode, VmState } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import {
  DeviceDeleteModalComponent,
} from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
import { DeviceDetailsComponent } from 'app/pages/vm/devices/device-list/device-details/device-details.component';
import { DeviceListComponent } from 'app/pages/vm/devices/device-list/device-list/device-list.component';
import { ExportDiskDialogComponent } from 'app/pages/vm/devices/device-list/export-disk-dialog/export-disk-dialog.component';

describe('DeviceListComponent', () => {
  let spectator: Spectator<DeviceListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  const devices = [
    {
      id: 1,
      order: 1001,
      vm: 4,
      attributes: {
        dtype: VmDeviceType.Cdrom,
      },
    },
    {
      id: 2,
      order: 1002,
      vm: 4,
      attributes: {
        dtype: VmDeviceType.Disk,
        path: '/dev/zvol/tank/test-disk',
        type: VmDiskMode.Ahci,
        logical_sectorsize: 512,
        physical_sectorsize: 512,
      },
    },
  ] as VmDevice[];

  const createComponent = createRoutingFactory({
    component: DeviceListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
    ],
    params: {
      pk: 76,
    },
    providers: [
      mockApi([
        mockCall('vm.device.query', devices),
        mockCall('vm.query', [{ id: 76, name: 'Test VM', status: { state: VmState.Stopped } } as VirtualMachine]),
        mockJob('vm.device.convert', fakeSuccessfulJob(true)),
      ]),
      mockAuth(),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(undefined),
        })),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({ result: true }),
        })),
      }),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  /**
   * Opens a row's kebab menu. Filtered by icon rather than test ID on purpose:
   * `IconButtonHarnessFilters` declares only name/library/size, so a `{ testId }` filter is
   * silently discarded by `with()` and would resolve every icon button on the page.
   */
  async function openRowMenu(rowIndex: number): Promise<TnMenuHarness> {
    const menuButtons = await loader.getAllHarnesses(
      TnIconButtonHarness.with({ name: 'dots-vertical', library: 'mdi' }),
    );
    await menuButtons[rowIndex].click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  // These members are template-facing (`protected`) or component-internal (`private`); the
  // typed accessors keep the cases below readable without a suppression at every call site.
  /* eslint-disable @typescript-eslint/dot-notation */
  const isDiskDevice = (device: VmDevice): boolean => spectator.component['isDiskDevice'](device);
  const setVmRunning = (running: boolean): void => spectator.component['isVmRunning'].set(running);
  const isVmRunning = (): boolean => spectator.component['isVmRunning']();
  const handleExportDisk = (device: VmDevice): void => spectator.component['handleExportDisk'](device);
  const onExportDisk = (device: VmDevice): void => spectator.component['onExportDisk'](device);
  const loadVmName = (): void => spectator.component['loadVmName']();
  /* eslint-enable @typescript-eslint/dot-notation */

  it('loads devices using virtual machine id from url', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.device.query', [[['vm', '=', 76]]]);
  });

  it('shows devices in a table', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Device ID', 'Device', 'Order', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['1', 'CD-ROM', '1001', ''],
      ['2', 'Disk', '1002', ''],
    ]);
  });

  it('renders row actions in a menu with per-device test ids', async () => {
    const menu = await openRowMenu(0);
    expect(await menu.getItemLabels()).toEqual(['Edit', 'Delete', 'Details']);

    // White-box: TnMenuHarness exposes no test-id getter yet, so the resolved data-test values
    // are read off the DOM. Replace with a harness filter once the library adds one
    // (see NAS-141021 library follow-ups).
    const itemTestIds = Array.from(document.querySelectorAll('.tn-menu-item'))
      .map((el) => el.getAttribute('data-test'));
    expect(itemTestIds).toEqual([
      'button-1-edit',
      'button-1-delete',
      'button-1-details',
    ]);
  });

  it('opens the edit form when Edit menu item is selected', async () => {
    const menu = await openRowMenu(0);
    await menu.clickItem({ label: 'Edit' });

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(DeviceFormComponent, {
      title: 'Edit Device for Test VM',
      inputs: {
        deviceFormData: {
          device: devices[0],
          virtualMachineId: 76,
          vmName: 'Test VM',
        },
      },
    });
  });

  it('shows Delete dialog when Delete option is selected', async () => {
    const menu = await openRowMenu(0);
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DeviceDeleteModalComponent, expect.objectContaining({
      data: devices[0],
    }));
  });

  it('shows details dialog when Details option is selected', async () => {
    const menu = await openRowMenu(0);
    await menu.clickItem({ label: 'Details' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DeviceDetailsComponent, {
      data: devices[0],
    });
  });

  describe('export disk functionality', () => {
    // The CD-ROM row's menu is asserted to have exactly Edit/Delete/Details above, so this
    // pair of tests pins both halves of the `@if (isDiskDevice(device))` gate.
    it('offers Export to Image on a disk row', async () => {
      const menu = await openRowMenu(1);

      expect(await menu.getItemLabels()).toEqual(['Edit', 'Delete', 'Details', 'Export to Image']);
    });

    it('disables Export to Image and says why while the VM is running', async () => {
      setVmRunning(true);
      spectator.detectChanges();

      const menu = await openRowMenu(1);

      expect(await menu.getItemLabels()).toContain('Export to Image (VM must be stopped)');
      expect(await menu.isItemDisabled({ label: 'Export to Image (VM must be stopped)' })).toBe(true);
    });

    it('opens the export dialog from the menu item when the VM is stopped', async () => {
      const menu = await openRowMenu(1);
      await menu.clickItem({ label: 'Export to Image' });

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
        ExportDiskDialogComponent,
        expect.objectContaining({ data: expect.objectContaining({ device: devices[1] }) }),
      );
    });

    it('correctly identifies disk devices', () => {
      expect(isDiskDevice(devices[0])).toBe(false); // CD-ROM
      expect(isDiskDevice(devices[1])).toBe(true); // Disk

      // Test with null/undefined
      expect(isDiskDevice(null)).toBe(false);
      expect(isDiskDevice(undefined)).toBe(false);
      expect(isDiskDevice({} as VmDevice)).toBe(false);
    });

    it('sets VM running state based on VM query', () => {
      const apiService = spectator.inject(ApiService);

      (apiService.call as jest.Mock).mockReturnValue(
        of([{ id: 76, name: 'Test VM', status: { state: VmState.Running } } as VirtualMachine]),
      );

      loadVmName();

      expect(isVmRunning()).toBe(true);
    });

    it('does not open export dialog when handleExportDisk is called and VM is running', () => {
      const dialog = spectator.inject(TnDialog);
      setVmRunning(true);

      handleExportDisk(devices[1]);

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('opens export dialog when handleExportDisk is called and VM is not running', () => {
      const dialog = spectator.inject(TnDialog);
      setVmRunning(false);

      handleExportDisk(devices[1]);

      expect(dialog.open).toHaveBeenCalledWith(
        ExportDiskDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            device: devices[1],
            vmName: 'Test VM',
          }),
        }),
      );
    });

    it('opens export dialog when onExportDisk is called', () => {
      const dialog = spectator.inject(TnDialog);

      onExportDisk(devices[1]);

      expect(dialog.open).toHaveBeenCalledWith(
        ExportDiskDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            device: devices[1],
            vmName: 'Test VM',
          }),
        }),
      );
    });

    it('handles successful export with job dialog and success message', () => {
      const dialogService = spectator.inject(DialogService);
      const snackbar = spectator.inject(SnackbarService);
      const tnDialog = spectator.inject(TnDialog);

      // Mock the export dialog result
      (tnDialog.open as jest.Mock).mockReturnValue({
        closed: of({
          request: {
            source: '/dev/zvol/tank/test-disk',
            destination: '/mnt/exports/vm-disk.qcow2',
          },
          destinationPath: '/mnt/exports/vm-disk.qcow2',
        }),
      });

      // Mock successful job completion
      (dialogService.jobDialog as jest.Mock).mockReturnValue({
        afterClosed: () => of({ result: true }),
      });

      // Trigger export
      onExportDisk(devices[1]);

      expect(snackbar.success).toHaveBeenCalledWith(
        'Disk image successfully exported to /mnt/exports/vm-disk.qcow2',
      );
    });
  });
});
