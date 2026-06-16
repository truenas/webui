// cspell:ignore ngneat debugkernel
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnCheckboxHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';

describe('KernelFormComponent', () => {
  let spectator: Spectator<KernelFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponentFor = (debugkernel: boolean): ReturnType<typeof createComponentFactory<KernelFormComponent>> => {
    return createComponentFactory({
      component: KernelFormComponent,
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        mockApi([
          mockCall('system.advanced.update'),
        ]),
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, {
          close: jest.fn(),
          getData: jest.fn(() => debugkernel),
          requireConfirmationWhen: jest.fn(),
        }),
        provideMockStore(),
        mockAuth(),
      ],
    });
  };

  describe('when debug kernel is currently enabled', () => {
    const createComponent = createComponentFor(true);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current system advanced kernel values when form is being edited', async () => {
      const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enable Debug Kernel' }));

      expect(await checkbox.isChecked()).toBe(true);
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enable Debug Kernel' }));
      await checkbox.uncheck();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{ debugkernel: false }]);
    });
  });

  describe('when debug kernel is currently disabled', () => {
    const createComponent = createComponentFor(false);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows debug kernel as disabled', async () => {
      const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enable Debug Kernel' }));

      expect(await checkbox.isChecked()).toBe(false);
    });

    it('enables debug kernel and saves', async () => {
      const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enable Debug Kernel' }));
      await checkbox.check();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{ debugkernel: true }]);
    });
  });
});
