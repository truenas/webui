import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { VmDisplayType } from 'app/enums/vm.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { DisplayVmDialogData } from 'app/pages/vm/vm-list/display-vm-dialog/display-vm-dialog-data.interface';
import { DisplayVmDialogComponent } from 'app/pages/vm/vm-list/display-vm-dialog/display-vm-dialog.component';
import { VirtualMachineRow } from 'app/pages/vm/vm-list/virtual-machine-row.interface';
import { DialogService, WebSocketService } from 'app/services';

describe('DisplayVmDialogComponent', () => {
  let spectator: Spectator<DisplayVmDialogComponent>;
  let websocket: WebSocketService;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: DisplayVmDialogComponent,
    imports: [
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: {} },
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockWindow({
        location: {
          host: 'localhost',
          protocol: 'http:',
        },
        open: jest.fn(),
      }),
      mockWebsocket([
        mockCall('vm.get_display_web_uri', {
          1: { error: null, uri: 'http://localhost:4200/vm/display/1/vnc.html' },
          2: { error: null, uri: 'http://localhost:4200/vm/display/2/vnc.html' },
        }),
      ]),
    ],
  });

  async function setupTest(dialogData: DisplayVmDialogData): Promise<void> {
    spectator = createComponent({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    });
    websocket = spectator.inject(WebSocketService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  }

  it('shows dialog when single divice and password_configured is false', async () => {
    await setupTest({
      vm: { id: 7, name: 'test' } as VirtualMachineRow,
      displayDevices: [{
        id: 1,
        attributes: {
          password_configured: false,
          type: VmDisplayType.Vnc,
        },
      }] as VmDisplayDevice[],
    });

    expect(websocket.call).toHaveBeenCalledWith('vm.get_display_web_uri', [7, 'localhost', { protocol: 'HTTP' }]);
    expect(spectator.inject<Window>(WINDOW).open).toHaveBeenNthCalledWith(1, 'http://localhost:4200/vm/display/1/vnc.html', '_blank');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('shows dialog when single divice and password_configured is true', async () => {
    await setupTest({
      vm: { id: 7, name: 'test' } as VirtualMachineRow,
      displayDevices: [{
        id: 1,
        attributes: {
          password_configured: true,
          type: VmDisplayType.Vnc,
        },
      }] as VmDisplayDevice[],
    });

    await form.fillForm({
      'Enter password': 'password123456',
    });

    expect(await form.getValues()).toEqual({
      'Enter password': 'password123456',
    });

    const openButton = await loader.getHarness(MatButtonHarness.with({ text: 'Open' }));
    await openButton.click();

    expect(websocket.call).toHaveBeenCalledWith('vm.get_display_web_uri', [7, 'localhost', {
      devices_passwords: [{
        device_id: 1,
        password: 'password123456',
      }],
      protocol: 'HTTP',
    }]);
    expect(spectator.inject<Window>(WINDOW).open).toHaveBeenNthCalledWith(2, 'http://localhost:4200/vm/display/1/vnc.html', '_blank');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('shows dialog when several divices and password_configured is fasle', async () => {
    await setupTest({
      vm: { id: 7, name: 'test' } as VirtualMachineRow,
      displayDevices: [{
        id: 1,
        attributes: {
          password_configured: true,
          type: VmDisplayType.Vnc,
        },
      }, {
        id: 2,
        attributes: {
          password_configured: false,
          type: VmDisplayType.Spice,
        },
      }] as VmDisplayDevice[],
    });

    expect(await form.getValues()).toEqual({
      'Display Device': VmDisplayType.Vnc,
      'Enter password': '',
    });

    await form.fillForm({
      'Display Device': VmDisplayType.Spice,
    });

    const openButton = await loader.getHarness(MatButtonHarness.with({ text: 'Open' }));
    await openButton.click();

    expect(websocket.call).toHaveBeenCalledWith('vm.get_display_web_uri', [7, 'localhost', { protocol: 'HTTP' }]);
    expect(spectator.inject<Window>(WINDOW).open).toHaveBeenNthCalledWith(3, 'http://localhost:4200/vm/display/2/vnc.html', '_blank');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('shows dialog when several divices and password_configured is true', async () => {
    await setupTest({
      vm: { id: 7, name: 'test' } as VirtualMachineRow,
      displayDevices: [{
        id: 1,
        attributes: {
          password_configured: false,
          type: VmDisplayType.Vnc,
        },
      }, {
        id: 2,
        attributes: {
          password_configured: true,
          type: VmDisplayType.Spice,
        },
      }] as VmDisplayDevice[],
    });

    expect(await form.getValues()).toEqual({
      'Display Device': VmDisplayType.Vnc,
    });

    await form.fillForm({ 'Display Device': VmDisplayType.Spice });
    await form.fillForm({ 'Enter password': 'password123456' });

    const openButton = await loader.getHarness(MatButtonHarness.with({ text: 'Open' }));
    await openButton.click();

    expect(websocket.call).toHaveBeenCalledWith('vm.get_display_web_uri', [7, 'localhost', {
      devices_passwords: [{
        device_id: 2,
        password: 'password123456',
      }],
      protocol: 'HTTP',
    }]);
    expect(spectator.inject<Window>(WINDOW).open).toHaveBeenNthCalledWith(4, 'http://localhost:4200/vm/display/2/vnc.html', '_blank');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('shows dialog when there are no devices', async () => {
    await setupTest({
      vm: { id: 7, name: 'test' } as VirtualMachineRow,
      displayDevices: [] as VmDisplayDevice[],
    });

    expect(await form.getValues()).toEqual({
      'Display Device': '',
    });
  });
});
