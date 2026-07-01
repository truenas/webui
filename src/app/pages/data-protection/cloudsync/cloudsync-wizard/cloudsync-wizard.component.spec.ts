import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepperHarness } from '@angular/material/stepper/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Direction } from 'app/enums/direction.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { StorjProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component';
import { googlePhotosCreds, googlePhotosProvider, storjProvider } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.testing.utils';
import { CloudSyncWizardComponent } from './cloudsync-wizard.component';

describe('CloudSyncWizardComponent', () => {
  let spectator: Spectator<CloudSyncWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness | null;
  let nextButton: TnButtonHarness | null;
  const slideInRef: SlideInRef<unknown, unknown> = {
    close: jest.fn(),
    swap: jest.fn(),
    getData: jest.fn(),
    requireConfirmationWhen: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: CloudSyncWizardComponent,
    imports: [
      ReactiveFormsModule,
      MatStepperModule,
      StorjProviderFormComponent,
    ],
    providers: [
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
      mockApi([
        mockCall('cloudsync.create'),
        mockCall('cloudsync.credentials.query', [googlePhotosCreds]),
        mockCall('cloudsync.credentials.create'),
        mockCall('cloudsync.credentials.update'),
        mockCall('cloudsync.credentials.delete'),
        mockCall('cloudsync.delete'),
        mockCall('cloudsync.providers', [googlePhotosProvider, storjProvider]),
      ]),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
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
    nextButton = await activeStep.getHarnessOrNull(TnButtonHarness.with({ label: 'Next' }));
  }

  async function goToNextStep(): Promise<void> {
    await nextButton!.click();
    await updateStepHarnesses();
  }

  it('creates objects when wizard is submitted', async () => {
    expect(await form!.getValues()).toEqual({});

    await (await loader.getHarness(TnSelectHarness.with({ ancestor: '[formControlName="exist_credential"]' })))
      .selectOption('Google Photos (Google Photos)');

    await goToNextStep();

    // The what-and-when step's Description is a migrated `tn-input`, so it's reached via
    // TnInputHarness rather than IxFormHarness (which only resolves ix-* controls).
    const descriptionInput = await loader.getHarness(
      TnInputHarness.with({ selector: '[formControlName="description"]' }),
    );
    await descriptionInput.setValue('Sync Google Photos - TestUser');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('cloudsync.create', [{
      attributes: {
        folder: '/',
      },
      bwlimit: [],
      create_empty_src_dirs: false,
      credentials: 1,
      description: 'Sync Google Photos - TestUser',
      direction: Direction.Pull,
      enabled: true,
      encryption: false,
      exclude: [],
      follow_symlinks: false,
      include: undefined,
      path: '/mnt',
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
      transfer_mode: TransferMode.Copy,
      transfers: 4,
    }]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Task created');
  });
});
