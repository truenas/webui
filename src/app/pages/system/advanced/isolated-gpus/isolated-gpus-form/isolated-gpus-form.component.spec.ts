import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { IsolatedGpusFormComponent } from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-form/isolated-gpus-form.component';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('IsolatedGpuPcisFormComponent', () => {
  let spectator: Spectator<IsolatedGpusFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: IsolatedGpusFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              isolated_gpu_pci_ids: ['0000:00:02.0'],
            } as AdvancedConfig,
          },
        ],
      }),
      mockWebSocket([
        mockCall('system.advanced.update_gpu_pci_ids'),
      ]),
      mockProvider(SystemGeneralService),
      mockProvider(IxChainedSlideInService, {
        pushComponent: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(GpuService, {
        getGpuOptions: () => of([
          { label: 'Fake HD Graphics', value: '0000:00:01.0' },
          { label: 'Intel Corporation HD Graphics 510', value: '0000:00:02.0' },
        ]),
      }),
      mockProvider(IsolatedGpuValidatorService, {
        validateGpu: () => of(null),
      }),
      mockProvider(ChainedRef, { close: jest.fn() }),
      mockAuth(),
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
      GPUs: ['Intel Corporation HD Graphics 510'],
    });
  });

  it('saves updated settings when Save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      GPUs: 'Fake HD Graphics',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('system.advanced.update_gpu_pci_ids', [['0000:00:01.0']]);
  });
});
