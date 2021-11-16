import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PullImageFormComponent } from 'app/pages/applications/forms/pull-image-form/pull-image-form.component';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/pages/common/ix-forms/testing/ix-form.harness';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('PullImageFormComponent', () => {
  let spectator: Spectator<PullImageFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: PullImageFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('container.image.pull'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('pulls docker image when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Username: 'john',
      Password: '12345678',
      'Image Name': 'private/redis',
      'Image Tag': 'stable',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.job).toHaveBeenCalledWith('container.image.pull', [{
      docker_authentication: {
        username: 'john',
        password: '12345678',
      },
      from_image: 'private/redis',
      tag: 'stable',
    }]);
  });
});
