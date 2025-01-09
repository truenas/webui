import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AuditConfig } from 'app/interfaces/audit/audit.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { AuditFormComponent } from 'app/pages/system/advanced/audit/audit-form/audit-form.component';

describe('AuditFormComponent', () => {
  let spectator: Spectator<AuditFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
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
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
      }),
      mockProvider(DialogService),
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
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(api.call).toHaveBeenCalledWith('audit.config');
    expect(values).toEqual({
      'Retention (in days)': '30',
      'Reservation (in GiB)': '100',
      'Quota (in GiB)': '100',
      'Quota Fill Warning (in %)': '80',
      'Quota Fill Critical (in %)': '95',
    });
  });

  it('saves both advanced config and dataset config when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Retention (in days)': 29,
      'Reservation (in GiB)': 99,
      'Quota (in GiB)': 99,
      'Quota Fill Warning (in %)': 79,
      'Quota Fill Critical (in %)': 94,
    });

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
});
