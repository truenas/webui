import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnMenuHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AlertConfigFormComponent } from 'app/pages/system/alert-config-form/alert-config-form.component';

describe('AlertConfigFormComponent', () => {
  let spectator: Spectator<AlertConfigFormComponent>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let api: ApiService;
  const createComponent = createComponentFactory({
    component: AlertConfigFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('alert.list_categories', [
          {
            id: 'APPLICATIONS',
            title: 'Applications',
            classes: [
              {
                id: AlertClassName.AppUpdate,
                title: 'app_title_1',
                level: AlertLevel.Info,
              },
              {
                id: AlertClassName.ApplicationsConfigurationFailed,
                title: 'app_title_1',
                level: AlertLevel.Warning,
              },
            ],
          },
          {
            id: 'CERTIFICATES',
            title: 'Certificates',
            classes: [
              {
                id: AlertClassName.CertificateExpired,
                title: 'cert_title_1',
                level: AlertLevel.Critical,
              },
              {
                id: AlertClassName.CertificateIsExpiring,
                title: 'cert_title_2',
                level: AlertLevel.Notice,
              },
            ],
          },
        ]),
        mockCall('alertclasses.config', {
          id: 1,
          classes: {
            [AlertClassName.AppUpdate]: {
              level: AlertLevel.Error,
              policy: AlertPolicy.Never,
            },
            [AlertClassName.CertificateIsExpiring]: {
              level: AlertLevel.Error,
            },
          },
        }),
        mockCall('alert.list_policies', [
          AlertPolicy.Immediately,
          AlertPolicy.Never,
          AlertPolicy.Daily,
          AlertPolicy.Hourly,
        ]),
        mockCall('alertclasses.update'),
      ]),
      mockProvider(LoaderService),
      mockProvider(DialogService),
      mockProvider(FormErrorHandlerService),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads current config and shows values in the form', async () => {
    expect(api.call).toHaveBeenCalledWith('alert.list_categories');
    expect(api.call).toHaveBeenCalledWith('alertclasses.config');

    // First category (Applications) is selected by default; its two classes render level/policy selects.
    const [appUpdateLevel, appUpdatePolicy, appFailedLevel, appFailedPolicy] = await loader
      .getAllHarnesses(IxSelectHarness);
    expect(await appUpdateLevel.getValue()).toBe(AlertLevel.Error);
    expect(await appUpdatePolicy.getValue()).toBe(AlertPolicy.Never);
    expect(await appFailedLevel.getValue()).toBe(AlertLevel.Warning);
    expect(await appFailedPolicy.getValue()).toBe(AlertPolicy.Immediately);
  });

  it('saves updated config', async () => {
    const [appUpdateLevel, appUpdatePolicy, appFailedLevel] = await loader.getAllHarnesses(IxSelectHarness);
    await appUpdateLevel.setValue(AlertLevel.Info);
    await appUpdatePolicy.setValue(AlertPolicy.Immediately);
    await appFailedLevel.setValue(AlertLevel.Notice);

    // Switch to the Certificates category to edit its classes within the same form.
    const categoriesTrigger = await loader.getHarness(TnButtonHarness.with({ label: 'Applications' }));
    await categoriesTrigger.click();
    const categoriesMenu = await rootLoader.getHarness(TnMenuHarness);
    await categoriesMenu.clickItem({ label: 'Certificates' });

    const [, certExpiredPolicy, , certExpiringPolicy] = await loader.getAllHarnesses(IxSelectHarness);
    await certExpiredPolicy.setValue(AlertPolicy.Never);
    await certExpiringPolicy.setValue(AlertPolicy.Hourly);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('alertclasses.update', [{
      classes: {
        [AlertClassName.ApplicationsConfigurationFailed]: { level: AlertLevel.Notice },
        [AlertClassName.CertificateExpired]: { policy: AlertPolicy.Never },
        [AlertClassName.CertificateIsExpiring]: { level: AlertLevel.Error, policy: AlertPolicy.Hourly },
      },
    }]);
  });

  it('disables Save button while form is loading', async () => {
    spectator.component.isFormLoading.set(true);
    spectator.detectChanges();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(true);
  });
});
