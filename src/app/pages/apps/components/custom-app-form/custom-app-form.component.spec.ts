import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { jsonToYaml } from 'app/helpers/json-to-yaml.helper';
import { App, ChartFormValue } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxCodeEditorHarness } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

const fakeApp = {
  name: 'test-app-one',
  version: '1',
  id: 'test-app-one',
  state: AppState.Running,
  upgrade_available: true,
  human_version: '2022.10_1.0.7',
  metadata: {
    app_version: '2022.10_1.0.8',
    icon: 'path-to-icon',
    train: 'stable',
  },
  custom_app: true,
  config: {
    services: {
      nginx: {
        image: 'nginx:1-alpine',
        ports: [
          '8089:80',
        ],
        volumes: [
          './html5up-stellar/:/usr/share/nginx/html',
        ],
      },
    },
    version: '3.8',
  } as Record<string, ChartFormValue>,
} as App;

describe('CustomAppFormComponent', () => {
  let spectator: Spectator<CustomAppFormComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: CustomAppFormComponent,
    imports: [
      IxCodeEditorComponent,
      MockComponent(PageHeaderComponent),
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(ApplicationsService, {
        getAllApps: jest.fn(() => {
          return of([fakeApp]);
        }),
        getApp: jest.fn(() => of([fakeApp])),
      }),
      mockProvider(ErrorHandlerService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: jest.fn(() => of(true)),
        })),
      }),
      mockApi([
        mockJob('app.create'),
        mockJob('app.update'),
      ]),
      mockProvider(Router),
    ],
  });

  function setupTest(app?: App): void {
    spectator = createComponent({
      props: { app },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('create app', () => {
    beforeEach(() => {
      setupTest();
    });

    it('checks save and closes slide in when successfully submitted', async () => {
      const appNameControl = await loader.getHarness(TnInputHarness);
      await appNameControl.setValue('test');
      const configControl = await loader.getHarness(IxCodeEditorHarness);
      await configControl.setValue('config');
      spectator.detectChanges();

      spectator.component.submit();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'app.create',
        [{
          custom_app: true,
          custom_compose_config_string: 'config',
          app_name: 'test',
        }],
      );
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    });

    it('forbidden app names are not allowed', async () => {
      const appNameControl = await loader.getHarness(TnInputHarness);
      await appNameControl.setValue('test-app-one');
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      expect(spectator.component.canSubmit()).toBe(false);
    });
  });

  describe('edit app', () => {
    beforeEach(() => {
      setupTest(fakeApp);
    });

    it('checks save and closes slide in when successfully submitted', () => {
      spectator.component.submit();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('app.update', [
        'test-app-one',
        { custom_compose_config_string: jsonToYaml(fakeApp.config) },
      ]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    });
  });
});
