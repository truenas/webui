import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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
});
