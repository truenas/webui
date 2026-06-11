import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnDialogHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { AppDeleteDialog } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { AppDeleteDialogInputData } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.interface';

describe('AppDeleteDialogComponent', () => {
  let spectator: Spectator<AppDeleteDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AppDeleteDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
        useValue: {
          name: 'ix-test-app',
          showRemoveVolumes: true,
        } as AppDeleteDialogInputData,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows dialog title', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('Delete application ix-test-app');
  });

  it('closes dialog with form values when dialog is submitted', async () => {
    const confirmInput = await loader.getHarness(IxInputHarness);
    await confirmInput.setValue('ix-test-app');

    const removeVolumesCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Remove iXVolumes' }));
    await removeVolumesCheckbox.check();
    const removeImagesCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Remove Images' }));
    await removeImagesCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
      confirmAppName: 'ix-test-app',
      removeImages: true,
      removeVolumes: true,
      forceRemoveVolumes: false,
    });
  });

  it('shows force remove volumes checkbox when Remove iXVolumes is selected', async () => {
    expect(await loader.getAllHarnesses(TnCheckboxHarness.with({ label: 'Force-remove iXVolumes' }))).toHaveLength(0);

    const confirmInput = await loader.getHarness(IxInputHarness);
    await confirmInput.setValue('ix-test-app');

    const removeVolumesCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Remove iXVolumes' }));
    await removeVolumesCheckbox.check();
    const forceRemoveVolumesCheckbox = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Force-remove iXVolumes' }),
    );
    await forceRemoveVolumesCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
      confirmAppName: 'ix-test-app',
      removeImages: true,
      removeVolumes: true,
      forceRemoveVolumes: true,
    });
  });

  it('prevents submission when app name confirmation is empty', async () => {
    const removeVolumesCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Remove iXVolumes' }));
    await removeVolumesCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    expect(await deleteButton.isDisabled()).toBe(true);
  });

  it('prevents submission when app name confirmation is incorrect', async () => {
    const confirmInput = await loader.getHarness(IxInputHarness);
    await confirmInput.setValue('wrong-name');

    const removeVolumesCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Remove iXVolumes' }));
    await removeVolumesCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    expect(await deleteButton.isDisabled()).toBe(true);
  });
});
