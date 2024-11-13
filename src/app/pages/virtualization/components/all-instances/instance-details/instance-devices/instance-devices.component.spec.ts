import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { VirtualizationProxy, VirtualizationUsb } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  InstanceDevicesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/instance-devices.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { WebSocketService } from 'app/services/ws.service';

describe('InstanceDevicesComponent', () => {
  let spectator: Spectator<InstanceDevicesComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: InstanceDevicesComponent,
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebSocket([
        mockCall('virt.instance.device_delete'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(VirtualizationInstancesStore, {
        isLoadingDevices: () => false,
        selectedInstance: () => ({ id: 'my-instance' }),
        selectedInstanceDevices: () => [
          {
            dev_type: VirtualizationDeviceType.Usb,
            name: 'usb1',
          } as VirtualizationUsb,
          {
            dev_type: VirtualizationDeviceType.Gpu,
            name: 'gpu1',
          },
          {
            name: 'proxy2',
          } as VirtualizationProxy,
        ],
        loadDevices: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a list of USB or GPU devices', () => {
    const devices = spectator.queryAll('.device');

    expect(devices).toHaveLength(2);
    expect(devices[0]).toHaveText('usb1');
    expect(devices[1]).toHaveText('gpu1');
  });

  it('deletes a device with confirmation and reloads the list when delete icon is pressed', async () => {
    const deleteIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-close' }));
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('virt.instance.device_delete', ['my-instance', 'usb1']);
    expect(spectator.inject(VirtualizationInstancesStore).loadDevices).toHaveBeenCalled();
  });
});
