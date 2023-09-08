import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('PullImageFormComponent', () => {
  let spectator: Spectator<PullImageFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: PullImageFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      EntityModule,
    ],
    providers: [
      mockWebsocket([
        mockJob('container.image.pull'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
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
