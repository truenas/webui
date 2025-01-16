import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AlertConfigFormComponent } from 'app/pages/system/alert-config-form/alert-config-form.component';

describe('AlertConfigFormComponent', () => {
  let spectator: Spectator<AlertConfigFormComponent>;
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
      mockProvider(AppLoaderService),
      mockProvider(DialogService),
      mockProvider(FormErrorHandlerService),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    api = spectator.inject(ApiService);
  });

  // TODO: Does not interact with the form as a user.
  it('loads current config and shows values in the form', () => {
    expect(api.call).toHaveBeenCalledWith('alert.list_categories');
    expect(api.call).toHaveBeenCalledWith('alertclasses.config');
    expect(spectator.component.form.value).toEqual({
      [AlertClassName.AppUpdate]: { level: AlertLevel.Error, policy: AlertPolicy.Never },
      [AlertClassName.ApplicationsConfigurationFailed]: { level: AlertLevel.Warning, policy: AlertPolicy.Immediately },
      [AlertClassName.CertificateExpired]: { level: AlertLevel.Critical, policy: AlertPolicy.Immediately },
      [AlertClassName.CertificateIsExpiring]: { level: AlertLevel.Error, policy: AlertPolicy.Immediately },
    });
  });

  it('saves updated config', () => {
    spectator.component.form.patchValue({
      [AlertClassName.AppUpdate]: { level: AlertLevel.Info, policy: AlertPolicy.Immediately },
      [AlertClassName.ApplicationsConfigurationFailed]: { level: AlertLevel.Notice },
      [AlertClassName.CertificateExpired]: { policy: AlertPolicy.Never },
      [AlertClassName.CertificateIsExpiring]: { policy: AlertPolicy.Hourly },
    });

    spectator.component.onSubmit();

    expect(api.call).toHaveBeenNthCalledWith(4, 'alertclasses.update', [{
      classes: {
        [AlertClassName.ApplicationsConfigurationFailed]: { level: AlertLevel.Notice },
        [AlertClassName.CertificateExpired]: { policy: AlertPolicy.Never },
        [AlertClassName.CertificateIsExpiring]: { level: AlertLevel.Error, policy: AlertPolicy.Hourly },
      },
    }]);
  });
});
