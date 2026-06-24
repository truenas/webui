import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('KernelFormComponent', () => {
  let spectator: Spectator<KernelFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const getDebugKernelCheckbox = (): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: '[formControlName="debugkernel"]' }),
  );

  const createComponent = createComponentFactory({
    component: KernelFormComponent,
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
            value: {
              debugkernel: true,
            } as AdvancedConfig,
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

  it('shows current system advanced kernel values when form is being edited', async () => {
    expect(await (await getDebugKernelCheckbox()).isChecked()).toBe(true);
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    await (await getDebugKernelCheckbox()).uncheck();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{ debugkernel: false }]);
  });
});
