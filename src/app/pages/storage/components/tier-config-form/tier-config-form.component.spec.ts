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

  const commonProviders = [
    mockApi([
      mockCall('zfs.tier.config', mockConfig),
      mockCall('zfs.tier.update', mockConfig),
    ]),
    mockProvider(FormErrorHandlerService),
    mockAuth(),
  ];

  function getInput(formControlName: string): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  function getCheckbox(formControlName: string): Promise<TnCheckboxHarness> {
    return loader.getHarness(TnCheckboxHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  // Production opens this form through FormSidePanelService (pools-dashboard.component.ts), so the
  // side-panel host — no SlideInRef, no in-form Save, submission driven by the panel footer — is
  // the real surface. Each host gets its own describe: two factories in one block would both
  // register a beforeEach and the last one registered would win.
  describe('side panel host', () => {
    const createComponent = createComponentFactory({
      component: TierConfigFormComponent,
      imports: [ReactiveFormsModule],
      providers: [...commonProviders, { provide: SlideInRef, useValue: null }],
    });

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

    it('renders no in-form Save', async () => {
      expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Save' }))).toBeNull();
    });

    it('submits updated values via zfs.tier.update and emits closed', async () => {
      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);

      await (await getCheckbox('enabled')).uncheck();
      await (await getInput('max_concurrent_jobs')).setValue('5');
      await (await getInput('max_used_percentage')).setValue('90');

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('zfs.tier.update', [{
        enabled: false,
        max_concurrent_jobs: 5,
        max_used_percentage: 90,
      }]);
      expect(closed).toHaveBeenCalledWith(true);
    });

    it('shows warning when enabling tiering for the first time', async () => {
      const disabledConfig = { enabled: false, max_concurrent_jobs: 1, max_used_percentage: 80 } as ZfsTierConfig;
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

    it('shows validation errors and blocks submission when values are out of range', async () => {
      await (await getInput('max_used_percentage')).setValue('150');
      await (await getInput('max_concurrent_jobs')).setValue('0');

      const percentField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Max Used Percentage' }));
      const jobsField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Max Concurrent Jobs' }));

      expect(await percentField.getErrorMessage()).toBe('Maximum value is 100');
      expect(await jobsField.getErrorMessage()).toBe('Minimum value is 1');

      // The panel footer's Save reads canSubmit(); there is no in-form button to assert against.
      expect(spectator.component.canSubmit()).toBe(false);
    });
  });

  describe('legacy SlideIn host', () => {
    const createComponent = createComponentFactory({
      component: TierConfigFormComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...commonProviders,
        mockProvider(SlideInRef, {
          close: jest.fn(),
          requireConfirmationWhen: jest.fn(),
          getData: jest.fn(() => undefined),
        }),
      ],
    });

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('renders its own Save and closes through the SlideInRef', async () => {
      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('zfs.tier.update', [{
        enabled: true,
        max_concurrent_jobs: 3,
        max_used_percentage: 80,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true });
    });
  });
});
