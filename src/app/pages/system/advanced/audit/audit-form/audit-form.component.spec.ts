import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnFormFieldHarness, TnInputHarness } from '@truenas/ui-components';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AuditConfig } from 'app/interfaces/audit/audit.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { AuditFormComponent } from 'app/pages/system/advanced/audit/audit-form/audit-form.component';

describe('AuditFormComponent', () => {
  let spectator: Spectator<AuditFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getField = (label: string): Promise<TnFormFieldHarness> => loader.getHarness(
    TnFormFieldHarness.with({ label }),
  );

  const createComponent = createComponentFactory({
    component: AuditFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
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
      mockProvider(DialogService),
      provideTnFormFieldErrors(),
      provideMockStore(),
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

  it('loads current settings for audit form and shows them', async () => {
    expect(api.call).toHaveBeenCalledWith('audit.config');

    expect(await (await getInput('retention')).getValue()).toBe('30');
    expect(await (await getInput('reservation')).getValue()).toBe('100');
    expect(await (await getInput('quota')).getValue()).toBe('100');
    expect(await (await getInput('quota_fill_warning')).getValue()).toBe('80');
    expect(await (await getInput('quota_fill_critical')).getValue()).toBe('95');
  });

  it('saves audit config when form is submitted', async () => {
    await (await getInput('retention')).setValue('29');
    await (await getInput('reservation')).setValue('99');
    await (await getInput('quota')).setValue('99');
    await (await getInput('quota_fill_warning')).setValue('79');
    await (await getInput('quota_fill_critical')).setValue('94');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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
    await (await getInput('quota_fill_warning')).setValue('70');
    await (await getInput('quota_fill_critical')).setValue('60');

    const criticalField = await getField('Quota Fill Critical (in %)');
    expect(await criticalField.getErrorMessage())
      .toBe('Quota Fill Critical must be greater than Quota Fill Warning.');
  });

  it('shows validation error when quota fill critical equals quota fill warning', async () => {
    await (await getInput('quota_fill_warning')).setValue('70');
    await (await getInput('quota_fill_critical')).setValue('70');

    const criticalField = await getField('Quota Fill Critical (in %)');
    expect(await criticalField.getErrorMessage())
      .toBe('Quota Fill Critical must be greater than Quota Fill Warning.');
  });
});
