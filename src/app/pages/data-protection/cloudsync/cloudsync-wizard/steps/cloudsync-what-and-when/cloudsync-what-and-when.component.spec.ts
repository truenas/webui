import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { googlePhotosCreds, googlePhotosProvider } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.testing.utils';
import { CloudsyncWhatAndWhenComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-what-and-when/cloudsync-what-and-when.component';
import { TransferModeExplanationComponent } from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { DatasetService } from 'app/services/dataset-service/dataset.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('CloudsyncWhatAndWhenComponent', () => {
  let spectator: Spectator<CloudsyncWhatAndWhenComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: CloudsyncWhatAndWhenComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      SchedulerModule,
    ],
    declarations: [
      TransferModeExplanationComponent,
    ],
    providers: [
      mockWebsocket([
        mockCall('cloudsync.create'),
        mockCall('cloudsync.update'),
        mockCall('cloudsync.credentials.query', [googlePhotosCreds]),
        mockCall('cloudsync.providers', [googlePhotosProvider]),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(DatasetService),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      'Directory/Files': '/mnt/gphotos',
      'Description': 'Sync Google Photos',
    });
  });

  it('returns fields when getPayload() is called', () => {
    expect(spectator.component.getPayload()).toEqual({
      attributes: {
        folder: '/',
      },
      bwlimit: [],
      create_empty_src_dirs: false,
      credentials: null,
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
    });
  });

  it('when an required field is empty, the "Save" button is disabled', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

    await form.fillForm({ 'Description': '' });
    expect(await saveButton.isDisabled()).toBe(true);

    await form.fillForm({ 'Description': 'Sync Google Photos' });
    expect(await saveButton.isDisabled()).toBe(false);
  });

  it('emits (save) when Save is selected', async () => {
    jest.spyOn(spectator.component.save, 'emit');
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    expect(spectator.component.save.emit).toHaveBeenCalled();
  });

  it('opens an advanced form when Advanced Options is pressed', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedButton.click();
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      buttonText: 'Continue',
      cancelText: 'Cancel',
      message:
        'Proceeding will result in the loss of your current cloud task data. However, your created provider will remain unaffected. Are you sure you want to continue?',
      title: 'Switch to Advanced Options',
    });
    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CloudsyncFormComponent, { wide: true });
  });
});
