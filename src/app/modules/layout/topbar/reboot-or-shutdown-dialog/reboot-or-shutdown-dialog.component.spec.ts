import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import {
  RebootOrShutdownDialogComponent,
} from 'app/modules/layout/topbar/reboot-or-shutdown-dialog/reboot-or-shutdown-dialog.component';

describe('RebootOrShutdownDialogComponent', () => {
  let spectator: Spectator<RebootOrShutdownDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: RebootOrShutdownDialogComponent,
    providers: [
      mockProvider(MatDialogRef),
    ],
  });

  it('shows appropriate button for a shutdown', async () => {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: true,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Shut Down' }));
    expect(button).toBeTruthy();
  });

  it('shows appropriate buttons and title for a reboot', async () => {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: false,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Restart' }));
    expect(button).toBeTruthy();
  });

  describe('closing the dialog', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: true,
          },
        ],
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('closes dialog with shutdown reason when it is selected from the list', async () => {
      const select = await loader.getHarness(IxSelectHarness);
      await select.setValue('System Update');

      const confirmCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Confirm' }));
      await confirmCheckbox.setValue(true);

      const shutdownButton = await loader.getHarness(MatButtonHarness.with({ text: 'Shut Down' }));
      await shutdownButton.click();

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('System Update');
    });

    it('allows user to enter custom reason', async () => {
      const select = await loader.getHarness(IxSelectHarness);
      await select.setValue('Custom Reason');

      const customReasonInput = await loader.getHarness(IxInputHarness.with({ label: 'Custom Reason' }));
      await customReasonInput.setValue('House on fire');

      const confirmCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Confirm' }));
      await confirmCheckbox.setValue(true);

      const shutdownButton = await loader.getHarness(MatButtonHarness.with({ text: 'Shut Down' }));
      await shutdownButton.click();

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('House on fire');
    });
  });
});
