import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepperHarness, MatStepperNextHarness } from '@angular/material/stepper/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudsyncProviderComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-provider/cloudsync-provider.component';
import { CloudsyncWhatAndWhenComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-what-and-when/cloudsync-what-and-when.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { CloudsyncWizardComponent } from './cloudsync-wizard.component';

const googlePhotosCreds = {
  id: 1,
  name: 'Google Photos',
  provider: CloudsyncProviderName.GooglePhotos,
  attributes: {
    client_id: 'test-client-id',
    client_secret: 'test-client-secret',
    token: 'test-token',
  },
};

describe('CloudsyncWizardComponent', () => {
  let spectator: Spectator<CloudsyncWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let nextButton: MatStepperNextHarness;

  const createComponent = createComponentFactory({
    component: CloudsyncWizardComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      MatStepperModule,
      SchedulerModule,
    ],
    declarations: [
      CloudsyncProviderComponent,
      CloudsyncWhatAndWhenComponent,
    ],
    providers: [
      mockWebsocket([
        mockCall('cloudsync.create'),
        mockCall('cloudsync.credentials.query', [googlePhotosCreds]),
        mockCall('cloudsync.credentials.create'),
        mockCall('cloudsync.credentials.update'),
        mockCall('cloudsync.credentials.delete'),
        mockCall('cloudsync.delete'),
      ]),
      mockProvider(DialogService),
      mockProvider(IxSlideInService),
      mockProvider(SnackbarService),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await updateStepHarnesses();
  });

  async function updateStepHarnesses(): Promise<void> {
    const stepper = await loader.getHarness(MatStepperHarness);
    const activeStep = (await stepper.getSteps({ selected: true }))[0];

    form = await activeStep.getHarnessOrNull(IxFormHarness);
    nextButton = await activeStep.getHarnessOrNull(MatStepperNextHarness.with({ text: 'Next' }));
  }

  async function goToNextStep(): Promise<void> {
    await nextButton.click();
    await updateStepHarnesses();
  }

  it('creates objects when wizard is submitted', async () => {
    expect(await form.getValues()).toBe({});

    await form.fillForm({
      'Load Existing Credentials': 'Google Photos',
    });

    await goToNextStep();

    await form.fillForm({
      'Description': 'Sync Google Photos - TestUser',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.credentials.create', [{
      name: 'Sync Google Photos - TestUser',
      provider: 'Google Photos',
    }]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('cloudsync.create', [{
      attributes: {
        folder: '/',
      },
      bwlimit: [],
      create_empty_src_dirs: false,
      credentials: [],
      description: 'Sync Google Photos',
      direction: 'PULL',
      enabled: true,
      encryption: false,
      exclude: [],
      follow_symlinks: false,
      include: undefined,
      path: '/mnt/gphotos',
      post_script: '',
      pre_script: '',
      schedule: {
        dom: '*',
        dow: '*',
        hour: '0',
        minute: '0',
        month: '*',
      },
      snapshot: false,
      transfer_mode: 'COPY',
      transfers: 4,
    }]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Task created');
  });
});

