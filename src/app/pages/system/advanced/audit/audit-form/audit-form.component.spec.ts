import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AuditConfig } from 'app/interfaces/audit/audit.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { AuditFormComponent } from 'app/pages/system/advanced/audit/audit-form/audit-form.component';

describe('AuditFormComponent', () => {
  let spectator: Spectator<AuditFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const setInput = async (name: string, value: string): Promise<void> => {
    const input = await loader.getHarness(TnInputHarness.with({ name }));
    await input.setValue(value);
  };

  const createComponent = createComponentFactory({
    component: AuditFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...ixFormTestingProviders(),
      mockApi([
        mockCall('audit.config', {
          retention: 30,
          reservation: 100,
          quota: 100,
          quota_fill_warning: 80,
          quota_fill_critical: 95,
        } as AuditConfig),
        mockCall('audit.update'),
      ]),
      provideMockStore(),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn(),
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

  it('loads current settings for audit form and shows them', async () => {
    const retention = await loader.getHarness(TnInputHarness.with({ name: 'retention' }));
    const reservation = await loader.getHarness(TnInputHarness.with({ name: 'reservation' }));
    const quota = await loader.getHarness(TnInputHarness.with({ name: 'quota' }));
    const quotaFillWarning = await loader.getHarness(TnInputHarness.with({ name: 'quota_fill_warning' }));
    const quotaFillCritical = await loader.getHarness(TnInputHarness.with({ name: 'quota_fill_critical' }));

    expect(api.call).toHaveBeenCalledWith('audit.config');
    expect(await retention.getNumericValue()).toBe(30);
    expect(await reservation.getNumericValue()).toBe(100);
    expect(await quota.getNumericValue()).toBe(100);
    expect(await quotaFillWarning.getNumericValue()).toBe(80);
    expect(await quotaFillCritical.getNumericValue()).toBe(95);
  });

  it('saves audit config when form is submitted', async () => {
    await setInput('retention', '29');
    await setInput('reservation', '99');
    await setInput('quota', '99');
    await setInput('quota_fill_warning', '79');
    await setInput('quota_fill_critical', '94');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('audit.update', [
      {
        retention: 29,
        reservation: 99,
        quota: 99,
        quota_fill_warning: 79,
        quota_fill_critical: 94,
      },
    ]);
  });

  it('shows validation error when quota fill critical is less than quota fill warning', async () => {
    await setInput('quota_fill_warning', '70');
    await setInput('quota_fill_critical', '60');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('shows validation error when quota fill critical equals quota fill warning', async () => {
    await setInput('quota_fill_warning', '70');
    await setInput('quota_fill_critical', '70');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(true);
  });
});
