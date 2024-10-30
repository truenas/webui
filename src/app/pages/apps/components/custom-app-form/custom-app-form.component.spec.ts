import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AppState } from 'app/enums/app-state.enum';
import { jsonToYaml } from 'app/helpers/json-to-yaml.helper';
import { App, ChartFormValue } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxCodeEditorHarness } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.harness';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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
      IxInputComponent,
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
      }),
      mockProvider(ErrorHandlerService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: jest.fn(() => of(true)),
        })),
      }),
      mockProvider(SlideInRef, {
        close: jest.fn(),
      }),
      mockWebSocket([
        mockJob('app.create'),
        mockJob('app.update'),
      ]),
      mockProvider(Router),
    ],
  });

  function setupTest(app?: App): void {
    spectator = createComponent({
      providers: [
        { provide: SLIDE_IN_DATA, useValue: app || null },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('create app', () => {
    beforeEach(() => {
      setupTest();
    });

    it('checks save and closes slide in when successfully submitted', async () => {
      const appNameControl = await loader.getHarness(IxInputHarness);
      await appNameControl.setValue('test');
      const configControl = await loader.getHarness(IxCodeEditorHarness);
      await configControl.setValue('config');
      spectator.detectChanges();
      const button = await loader.getHarness(MatButtonHarness);
      await button.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
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
      const appNameControl = await loader.getHarness(IxInputHarness);
      await appNameControl.setValue('test-app-one');
      spectator.detectChanges();

      const button = await loader.getHarness(MatButtonHarness);
      expect(button.isDisabled()).toBeTruthy();
    });
  });

  describe('edit app', () => {
    beforeEach(() => {
      setupTest(fakeApp);
    });

    it('checks save and closes slide in when successfully submitted', async () => {
      const button = await loader.getHarness(MatButtonHarness);
      await button.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('app.update', [
        'test-app-one',
        { custom_compose_config_string: jsonToYaml(fakeApp.config) },
      ]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    });
  });
});
