import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnFormFieldHarness, TnInputHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ZfsTierConfig } from 'app/interfaces/zfs-tier.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
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
    max_used_percentage: 80,
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

  function getInput(formControlName: string): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  function getCheckbox(formControlName: string): Promise<TnCheckboxHarness> {
    return loader.getHarness(TnCheckboxHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads config on init and populates form fields', async () => {
    expect(api.call).toHaveBeenCalledWith('zfs.tier.config');

    expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
    expect(await (await getInput('max_concurrent_jobs')).getValue()).toBe('3');
    expect(await (await getInput('max_used_percentage')).getValue()).toBe('80');
  });

  it('submits updated values via zfs.tier.update', async () => {
    await (await getCheckbox('enabled')).uncheck();
    await (await getInput('max_concurrent_jobs')).setValue('5');
    await (await getInput('max_used_percentage')).setValue('90');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('zfs.tier.update', [{
      enabled: false,
      max_concurrent_jobs: 5,
      max_used_percentage: 90,
    }]);
    expect(slideInRef.close).toHaveBeenCalledWith({ response: true });
  });

  it('shows warning when enabling tiering for the first time', async () => {
    const disabledConfig = { enabled: false, max_concurrent_jobs: 1, max_used_percentage: 80 } as ZfsTierConfig;
    jest.spyOn(api, 'call').mockReturnValueOnce(of(disabledConfig));

    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.detectChanges();

    expect(spectator.query('tn-banner')).not.toExist();

    await (await getCheckbox('enabled')).check();

    expect(spectator.query('tn-banner')).toExist();
  });

  it('does not show warning when tiering is already enabled', () => {
    expect(spectator.query('tn-banner')).not.toExist();
  });

  it('shows validation errors and disables Save when max_used_percentage > 100 or max_concurrent_jobs < 1', async () => {
    await (await getInput('max_used_percentage')).setValue('150');
    await (await getInput('max_concurrent_jobs')).setValue('0');

    const percentField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Max Used Percentage' }));
    const jobsField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Max Concurrent Jobs' }));

    expect(await percentField.getErrorMessage()).toBe('Maximum value is 100');
    expect(await jobsField.getErrorMessage()).toBe('Minimum value is 1');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(true);
  });
});
