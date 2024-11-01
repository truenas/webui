import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VmDeviceType } from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import {
  DeviceDeleteModalComponent,
} from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
import { DeviceDetailsComponent } from 'app/pages/vm/devices/device-list/device-details/device-details.component';
import { DeviceListComponent } from 'app/pages/vm/devices/device-list/device-list/device-list.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DeviceListComponent', () => {
  let spectator: Spectator<DeviceListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;
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
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
      IxTableDetailsRowDirective,
      IxTableCellDirective,
    ],
    params: {
      pk: 76,
    },
    providers: [
      mockWebSocket([
        mockCall('vm.device.query', devices),
      ]),
      mockAuth(),
      mockProvider(SlideInService, {
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
    table = await loader.getHarness(IxTableHarness);
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

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(DeviceFormComponent, {
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
