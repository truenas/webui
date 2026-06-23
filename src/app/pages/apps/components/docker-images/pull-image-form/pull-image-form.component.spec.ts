import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';

describe('PullImageFormComponent', () => {
  let spectator: Spectator<PullImageFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: PullImageFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockJob('app.image.pull'),
      ]),
      mockProvider(SlideIn),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('pulls docker image when form is submitted', async () => {
    await (await loader.getHarness(TnInputHarness.with({ name: 'image' }))).setValue('private/redis');
    await (await loader.getHarness(TnInputHarness.with({ name: 'tag' }))).setValue('stable');
    await (await loader.getHarness(TnInputHarness.with({ name: 'username' }))).setValue('john');
    await (await loader.getHarness(TnInputHarness.with({ name: 'password' }))).setValue('12345678');

    spectator.component.submit();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(api.job).toHaveBeenCalledWith('app.image.pull', [{
      auth_config: {
        username: 'john',
        password: '12345678',
      },
      image: 'private/redis:stable',
    }]);
  });
});
