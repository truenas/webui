import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { AppDeleteDialog } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppDeleteDialogInputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';

describe('AppDeleteDialogComponent', () => {
  let spectator: Spectator<AppDeleteDialog>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: AppDeleteDialog,
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

  it('shows dialog title', () => {
    expect(spectator.query('[matDialogTitle]')).toHaveText('Delete application ix-test-app');
  });

  it('closes dialog with form values when dialog is submitted', async () => {
    const confirmInput = await loader.getHarness(IxInputHarness);
    await confirmInput.setValue('ix-test-app');

    await form.fillForm({
      'Remove iXVolumes': true,
      'Remove Images': true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      confirmAppName: 'ix-test-app',
      removeImages: true,
      removeVolumes: true,
      forceRemoveVolumes: false,
    });
  });

  it('shows force remove volumes checkbox when Remove iXVolumes is selected', async () => {
    expect(await form.getLabels()).not.toContain('Force-remove iXVolumes');

    const confirmInput = await loader.getHarness(IxInputHarness);
    await confirmInput.setValue('ix-test-app');

    await form.fillForm({
      'Remove iXVolumes': true,
      'Force-remove iXVolumes': true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      confirmAppName: 'ix-test-app',
      removeImages: true,
      removeVolumes: true,
      forceRemoveVolumes: true,
    });
  });

  it('prevents submission when app name confirmation is empty', async () => {
    await form.fillForm({
      'Remove iXVolumes': true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    expect(await deleteButton.isDisabled()).toBe(true);
  });

  it('prevents submission when app name confirmation is incorrect', async () => {
    const confirmInput = await loader.getHarness(IxInputHarness);
    await confirmInput.setValue('wrong-name');

    await form.fillForm({
      'Remove iXVolumes': true,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    expect(await deleteButton.isDisabled()).toBe(true);
  });
});
