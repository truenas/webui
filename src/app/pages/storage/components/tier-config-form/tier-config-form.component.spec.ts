import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ZfsTierConfig } from 'app/interfaces/zfs-tier.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { TierConfigFormComponent } from 'app/pages/storage/components/tier-config-form/tier-config-form.component';

describe('TierConfigFormComponent', () => {
  let spectator: Spectator<TierConfigFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const mockConfig = {
    enabled: true,
    max_concurrent_jobs: 3,
    min_available_space: 10,
  } as ZfsTierConfig;

  const slideInRef: SlideInRef<void, boolean> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: TierConfigFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('zfs.tier.config', mockConfig),
        mockCall('zfs.tier.update', mockConfig),
      ]),
      mockProvider(SlideIn),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads config on init and populates form fields', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(api.call).toHaveBeenCalledWith('zfs.tier.config');
    expect(values).toEqual({
      Enabled: true,
      'Max Concurrent Jobs': '3',
      'Minimum Available Space (GiB)': '10',
    });
  });

  it('submits updated values via zfs.tier.update', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Enabled: false,
      'Max Concurrent Jobs': 5,
      'Minimum Available Space (GiB)': 20,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('zfs.tier.update', [{
      enabled: false,
      max_concurrent_jobs: 5,
      min_available_space: 20,
    }]);
    expect(slideInRef.close).toHaveBeenCalledWith({ response: true });
  });
});
