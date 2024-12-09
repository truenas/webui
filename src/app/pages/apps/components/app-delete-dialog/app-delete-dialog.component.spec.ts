import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { AppDeleteDialogComponent } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppDeleteDialogInputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';

describe('AppDeleteDialogComponent', () => {
  let spectator: Spectator<AppDeleteDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: AppDeleteDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          name: 'ix-test-app',
          showRemoveVolumes: true,
        } as AppDeleteDialogInputData,
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows dialog message', () => {
    expect(spectator.query('.message')).toHaveText('Delete ix-test-app?');
  });

  it('closes dialog with form values when dialog is submitted', async () => {
    await form.fillForm({
      'Remove iXVolumes': true,
      'Remove Images': true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      removeImages: true,
      removeVolumes: true,
      forceRemoveVolumes: false,
    });
  });

  it('shows force remove volumes checkbox when Remove iXVolumes is selected', async () => {
    expect(await form.getLabels()).not.toContain('Force-remove iXVolumes');

    await form.fillForm({
      'Remove iXVolumes': true,
      'Force-remove iXVolumes': true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      removeImages: true,
      removeVolumes: true,
      forceRemoveVolumes: true,
    });
  });
});
