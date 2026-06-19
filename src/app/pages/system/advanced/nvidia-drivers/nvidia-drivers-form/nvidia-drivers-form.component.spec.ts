import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  NvidiaDriversFormComponent,
} from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-form/nvidia-drivers-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('NvidiaDriversFormComponent', () => {
  let spectator: Spectator<NvidiaDriversFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: NvidiaDriversFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('system.advanced.update'),
      ]),
      mockProvider(ErrorHandlerService),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: { nvidia: true } as AdvancedConfig,
          },
        ],
      }),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads current NVIDIA drivers setting and shows it', async () => {
    expect(await (await getCheckbox('nvidia')).isChecked()).toBe(true);
  });

  it('saves updated NVIDIA drivers setting when Save is pressed', async () => {
    await (await getCheckbox('nvidia')).uncheck();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{ nvidia: false }]);
  });
});
