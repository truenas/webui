import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { Device } from 'app/interfaces/device.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { IsolatedGpuPcisFormComponent } from 'app/pages/system/advanced/isolated-gpu-pcis/isolated-gpu-pcis-form.component';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('IsolatedGpuPcisFormComponent', () => {
  let spectator: Spectator<IsolatedGpuPcisFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const mockDeviceFirst = {
    addr: {
      pci_slot: '0000:00:01.0',
    },
    description: 'Fake HD Graphics',
  } as Device;
  const mockDeviceSecond = {
    addr: {
      pci_slot: '0000:00:02.0',
    },
    description: 'Intel Corporation HD Graphics 510',
  } as Device;

  const createComponent = createComponentFactory({
    component: IsolatedGpuPcisFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('device.get_info', [mockDeviceFirst, mockDeviceSecond]),
        mockCall('system.advanced.config', {
          isolated_gpu_pci_ids: ['0000:00:02.0'],
        } as AdvancedConfig),
        mockCall('system.advanced.update_gpu_pci_ids'),
      ]),
      mockProvider(SystemGeneralService),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      provideMockStore(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads current settings and shows them', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      "GPU's": ['Intel Corporation HD Graphics 510'],
    });
  });

  it('saves updated settings when Save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      "GPU's": 'Fake HD Graphics',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('system.advanced.update_gpu_pci_ids', [['0000:00:01.0']]);
  });
});
