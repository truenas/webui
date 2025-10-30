import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
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
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
  let table: IxTableHarness;
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
      IxTableDetailsRowDirective,
      IxTableCellDirective,
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
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
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
    table = await loader.getHarness(IxTableHarness);
  });

  it('loads devices using virtual machine id from url', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.device.query', [[['vm', '=', 76]]]);
  });

  it('shows devices in a table', async () => {
    const cells = await table.getCellTexts();
    expect(cells).toEqual([
      ['Device ID', 'Device', 'Order', ''],
      ['1', 'CD-ROM', '1001', ''],
      ['2', 'Disk', '1002', ''],
    ]);
  });

  it('opens the edit form when Edit menu item is selected', async () => {
    const menuButton = await table.getHarnessInCell(MatButtonHarness, 1, 3);
    await menuButton.click();

    const menu = await loader.getHarness(MatMenuHarness);
    await menu.clickItem({ text: 'Edit' });

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(DeviceFormComponent, {
      data: {
        device: devices[0],
        virtualMachineId: 76,
      },
    });
  });

  it('shows Delete dialog when Delete option is selected', async () => {
    const menuButton = await table.getHarnessInCell(MatButtonHarness, 1, 3);
    await menuButton.click();

    const menu = await loader.getHarness(MatMenuHarness);
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DeviceDeleteModalComponent, expect.objectContaining({
      data: devices[0],
    }));
  });

  it('shows details dialog when Details option is selected', async () => {
    const menuButton = await table.getHarnessInCell(MatButtonHarness, 1, 3);
    await menuButton.click();

    const menu = await loader.getHarness(MatMenuHarness);
    await menu.clickItem({ text: 'Details' });

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DeviceDetailsComponent, {
      data: devices[0],
    });
  });

  describe('export disk functionality', () => {
    it('correctly identifies disk devices', () => {
      expect(spectator.component.isDiskDevice(devices[0])).toBe(false); // CD-ROM
      expect(spectator.component.isDiskDevice(devices[1])).toBe(true); // Disk

      // Test with null/undefined
      expect(spectator.component.isDiskDevice(null)).toBe(false);
      expect(spectator.component.isDiskDevice(undefined)).toBe(false);
      expect(spectator.component.isDiskDevice({} as VmDevice)).toBe(false);
    });

    it('sets VM running state based on VM query', () => {
      const apiService = spectator.inject(ApiService);

      (apiService.call as jest.Mock).mockReturnValue(
        of([{ id: 76, name: 'Test VM', status: { state: VmState.Running } } as VirtualMachine]),
      );

      spectator.component.loadVmName();

      expect(spectator.component.isVmRunning()).toBe(true);
    });

    it('does not open export dialog when handleExportDisk is called and VM is running', () => {
      const dialog = spectator.inject(MatDialog);
      spectator.component.isVmRunning.set(true);

      spectator.component.handleExportDisk(devices[1]);

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('opens export dialog when handleExportDisk is called and VM is not running', () => {
      const dialog = spectator.inject(MatDialog);
      spectator.component.isVmRunning.set(false);

      spectator.component.handleExportDisk(devices[1]);

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
      const dialog = spectator.inject(MatDialog);

      spectator.component.onExportDisk(devices[1]);

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
      const matDialog = spectator.inject(MatDialog);

      // Mock the export dialog result
      (matDialog.open as jest.Mock).mockReturnValue({
        afterClosed: () => of({
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
      spectator.component.onExportDisk(devices[1]);

      expect(snackbar.success).toHaveBeenCalledWith(
        'Disk image successfully exported to /mnt/exports/vm-disk.qcow2',
      );
    });
  });
});
