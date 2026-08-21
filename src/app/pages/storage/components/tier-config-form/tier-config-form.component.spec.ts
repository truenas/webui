import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnBannerHarness, TnButtonHarness, TnCheckboxHarness, TnFormFieldHarness, TnInputHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ZfsTierConfig } from 'app/interfaces/zfs-tier.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
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
    special_class_metadata_reserve_pct: 25,
  } as ZfsTierConfig;

  // pools-dashboard opens this form through FormSidePanelService, which is its only host: no
  // No in-form Save: submission is driven by the panel footer calling `submit()`.
  const createComponent = createComponentFactory({
    component: TierConfigFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([
        mockCall('zfs.tier.config', mockConfig),
        mockCall('zfs.tier.update', mockConfig),
      ]),
      mockProvider(FormErrorHandlerService),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  function getInput(formControlName: string): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  function getCheckbox(formControlName: string): Promise<TnCheckboxHarness> {
    return loader.getHarness(TnCheckboxHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  it('loads config on init and populates form fields', async () => {
    expect(api.call).toHaveBeenCalledWith('zfs.tier.config');

    expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
    expect(await (await getInput('max_concurrent_jobs')).getValue()).toBe('3');
    expect(await (await getInput('max_used_percentage')).getValue()).toBe('80');
    expect(await (await getInput('special_class_metadata_reserve_pct')).getValue()).toBe('25');
  });

  it('renders no in-form Save', async () => {
    expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Save' }))).toBeNull();
  });

  it('submits updated values via zfs.tier.update and emits closed', async () => {
    const closed = jest.fn();
    spectator.component.closed.subscribe(closed);

    await (await getCheckbox('enabled')).uncheck();
    await (await getInput('max_concurrent_jobs')).setValue('5');
    await (await getInput('max_used_percentage')).setValue('90');
    await (await getInput('special_class_metadata_reserve_pct')).setValue('20');

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('zfs.tier.update', [{
      enabled: false,
      max_concurrent_jobs: 5,
      max_used_percentage: 90,
      special_class_metadata_reserve_pct: 20,
    }]);
    expect(closed).toHaveBeenCalledWith(true);
  });

  it('shows warning when enabling tiering for the first time', async () => {
    const disabledConfig = {
      enabled: false,
      max_concurrent_jobs: 1,
      max_used_percentage: 80,
      special_class_metadata_reserve_pct: 25,
    } as ZfsTierConfig;
    jest.spyOn(api, 'call').mockReturnValueOnce(of(disabledConfig));

    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.detectChanges();

    expect(await loader.getHarnessOrNull(TnBannerHarness)).toBeNull();

    await (await getCheckbox('enabled')).check();

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain('Shares will be locked to a single dataset');
  });

  it('does not show warning when tiering is already enabled', async () => {
    expect(await loader.getHarnessOrNull(TnBannerHarness)).toBeNull();
  });

  it('shows validation errors and blocks submission when values exceed their maximums', async () => {
    await (await getInput('max_used_percentage')).setValue('96');
    await (await getInput('max_concurrent_jobs')).setValue('11');
    await (await getInput('special_class_metadata_reserve_pct')).setValue('31');

    const percentField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Max Used Percentage' }));
    const jobsField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Max Concurrent Jobs' }));
    const reserveField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Performance Tier Reserve' }));

    expect(await percentField.getErrorMessage()).toBe('Maximum value is 95');
    expect(await jobsField.getErrorMessage()).toBe('Maximum value is 10');
    expect(await reserveField.getErrorMessage()).toBe('Maximum value is 30');

    // The panel footer's Save reads canSubmit(); there is no in-form button to assert against.
    expect(spectator.component.canSubmit()).toBe(false);
  });

  it('shows validation errors and blocks submission when values fall below their minimums', async () => {
    await (await getInput('max_used_percentage')).setValue('69');
    await (await getInput('max_concurrent_jobs')).setValue('0');
    await (await getInput('special_class_metadata_reserve_pct')).setValue('9');

    const percentField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Max Used Percentage' }));
    const jobsField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Max Concurrent Jobs' }));
    const reserveField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Performance Tier Reserve' }));

    expect(await percentField.getErrorMessage()).toBe('Minimum value is 70');
    expect(await jobsField.getErrorMessage()).toBe('Minimum value is 1');
    expect(await reserveField.getErrorMessage()).toBe('Minimum value is 10');

    expect(spectator.component.canSubmit()).toBe(false);
  });
});
