import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AppState } from 'app/enums/app-state.enum';
import { App } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
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
} as App;

describe('CustomAppFormComponent', () => {
  let spectator: Spectator<CustomAppFormComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: CustomAppFormComponent,
    imports: [
      IxFormsModule,
      MockModule(PageHeaderModule),
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
          afterClosed: jest.fn(() => of()),
        })),
      }),
      mockProvider(IxSlideInRef),
      mockWebSocket([
        mockJob('app.create'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('closes slide in when successfully submitted', async () => {
    spectator.component.form.patchValue({
      release_name: 'test',
      custom_compose_config_string: 'config',
    });
    const button = await loader.getHarness(MatButtonHarness);
    await button.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('app.create', [{
      custom_app: true,
      custom_compose_config_string: 'config',
      app_name: 'test',
    }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
  });

  it('forbidden app names are not allowed', async () => {
    spectator.component.form.patchValue({
      release_name: 'test-app-one',
    });
    spectator.detectChanges();

    const button = await loader.getHarness(MatButtonHarness);
    expect(button.isDisabled()).toBeTruthy();
  });
});
