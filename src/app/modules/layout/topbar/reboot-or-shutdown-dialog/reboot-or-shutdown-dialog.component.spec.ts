import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import {
  RebootOrShutdownDialog,
} from 'app/modules/layout/topbar/reboot-or-shutdown-dialog/reboot-or-shutdown-dialog.component';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('RebootOrShutdownDialogComponent', () => {
  let spectator: Spectator<RebootOrShutdownDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: RebootOrShutdownDialog,
    providers: [
      mockProvider(MatDialogRef),
      provideMockStore({
        selectors: [
          {
            selector: selectIsEnterprise,
            value: true,
          },
        ],
      }),
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

describe('RebootOrShutdownDialog – non-enterprise', () => {
  let spectator: Spectator<RebootOrShutdownDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: RebootOrShutdownDialog,
    providers: [
      mockProvider(MatDialogRef),
      provideMockStore({
        selectors: [
          {
            selector: selectIsEnterprise,
            value: false,
          },
        ],
      }),
    ],
  });

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

  it('does not show "Confirm is required" warning initially', () => {
    expect(spectator.query('ix-errors mat-error')).not.toExist();
  });

  it('shows "Confirm is required" warning only after checking and unchecking confirm', async () => {
    const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Confirm' }));
    await checkbox.setValue(true);
    expect(spectator.query('ix-errors mat-error')).not.toExist();

    await checkbox.setValue(false);
    expect(spectator.query('ix-errors mat-error')).toExist();
  });

  it('should not render select/input and allow submission when only confirm is checked', async () => {
    const select = spectator.query('ix-select');
    expect(select).toBeNull();

    const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Confirm' }));
    await checkbox.setValue(true);

    const submit = await loader.getHarness(MatButtonHarness.with({ text: /Restart|Shut Down/ }));
    await submit.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(expect.stringMatching(/Unspecified/i));
  });
});
