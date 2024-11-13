import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualizationDevice } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  DeleteDeviceButtonComponent,
} from 'app/pages/virtualization/components/common/delete-device-button/delete-device-button.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { WebSocketService } from 'app/services/ws.service';

describe('DeleteDeviceButtonComponent', () => {
  let spectator: Spectator<DeleteDeviceButtonComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeleteDeviceButtonComponent,
    providers: [
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebSocket([
        mockCall('virt.instance.device_delete'),
      ]),
      mockProvider(VirtualizationInstancesStore, {
        selectedInstance: () => ({
          id: 'my-instance',
        }),
        loadDevices: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        device: {
          name: 'my-device',
        } as VirtualizationDevice,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows button as disabled for readonly devices', async () => {
    spectator.setInput('device', {
      name: 'my-device',
      readonly: true,
    } as VirtualizationDevice);

    const button = await loader.getHarness(MatButtonHarness);
    expect(await button.isDisabled()).toBe(true);
  });

  it('deletes a device with confirmation and reloads the store when button is pressed', async () => {
    const deleteIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-close' }));
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('virt.instance.device_delete', ['my-instance', 'my-device']);
    expect(spectator.inject(VirtualizationInstancesStore).loadDevices).toHaveBeenCalled();
  });
});
