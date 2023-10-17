import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VmDeviceType } from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import {
  DeviceDeleteModalComponent,
} from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
import { DeviceDetailsComponent } from 'app/pages/vm/devices/device-list/device-details/device-details.component';
import { DeviceListComponent } from 'app/pages/vm/devices/device-list/device-list/device-list.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DeviceListComponent', () => {
  let spectator: Spectator<DeviceListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;
  const devices = [
    {
      id: 1,
      dtype: VmDeviceType.Cdrom,
      order: 1001,
      vm: 4,
    },
    {
      id: 2,
      dtype: VmDeviceType.Disk,
      order: 1002,
      vm: 4,
    },
  ] as VmDevice[];

  const createComponent = createRoutingFactory({
    component: DeviceListComponent,
    imports: [
      IxTable2Module,
    ],
    params: {
      pk: 76,
    },
    providers: [
      mockWebsocket([
        mockCall('vm.device.query', devices),
      ]),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('loads devices using virtual machine id from url', () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('vm.device.query', [[['vm', '=', 76]]]);
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

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(DeviceFormComponent, {
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
});
