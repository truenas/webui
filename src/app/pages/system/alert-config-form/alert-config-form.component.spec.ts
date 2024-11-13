import { ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AlertConfigFormComponent } from 'app/pages/system/alert-config-form/alert-config-form.component';
import { ApiService } from 'app/services/api.service';

describe('AlertConfigFormComponent', () => {
  let spectator: Spectator<AlertConfigFormComponent>;
  let ws: ApiService;
  const createComponent = createComponentFactory({
    component: AlertConfigFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('alert.list_categories', [
          {
            id: 'APPLICATIONS',
            title: 'Applications',
            classes: [
              {
                id: 'app_1',
                title: 'app_title_1',
                level: AlertLevel.Info,
              },
              {
                id: 'app_2',
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
                id: 'cert_1',
                title: 'cert_title_1',
                level: AlertLevel.Critical,
              },
              {
                id: 'cert_2',
                title: 'cert_title_2',
                level: AlertLevel.Notice,
              },
            ],
          },
        ]),
        mockCall('alertclasses.config', {
          id: 1,
          classes: {
            app_1: {
              level: AlertLevel.Error,
              policy: AlertPolicy.Never,
            },
            cert_2: {
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
    ws = spectator.inject(ApiService);
  });

  // TODO: Does not interact with the form as a user.
  it('loads current config and shows values in the form', () => {
    expect(ws.call).toHaveBeenCalledWith('alert.list_categories');
    expect(ws.call).toHaveBeenCalledWith('alertclasses.config');
    expect(spectator.component.form.value).toEqual({
      app_1: { level: AlertLevel.Error, policy: AlertPolicy.Never },
      app_2: { level: AlertLevel.Warning, policy: AlertPolicy.Immediately },
      cert_1: { level: AlertLevel.Critical, policy: AlertPolicy.Immediately },
      cert_2: { level: AlertLevel.Error, policy: AlertPolicy.Immediately },
    });
  });

  it('saves updated config', () => {
    spectator.component.form.patchValue({
      app_1: { level: AlertLevel.Info, policy: AlertPolicy.Immediately },
      app_2: { level: AlertLevel.Notice },
      cert_1: { policy: AlertPolicy.Never },
      cert_2: { policy: AlertPolicy.Hourly },
    });

    spectator.component.onSubmit();

    expect(ws.call).toHaveBeenNthCalledWith(4, 'alertclasses.update', [{
      classes: {
        app_2: { level: AlertLevel.Notice },
        cert_1: { policy: AlertPolicy.Never },
        cert_2: { level: AlertLevel.Error, policy: AlertPolicy.Hourly },
      },
    }]);
  });
});
