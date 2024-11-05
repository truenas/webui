import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ConfirmOptions, ConfirmOptionsWithSecondaryCheckbox } from 'app/interfaces/dialog.interface';
import { ConfirmDialogComponent } from 'app/modules/dialog/components/confirm-dialog/confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let spectator: Spectator<ConfirmDialogComponent>;
  let loader: HarnessLoader;
  const options = {
    title: 'Launch nukes?',
    message: 'Are you sure you want to launch nukes?',
    buttonText: 'Launch',
    cancelText: 'Do not launch',
    confirmationCheckboxText: 'Yeah whatever',
  } as ConfirmOptions;
  const createComponent = createComponentFactory({
    component: ConfirmDialogComponent,
    imports: [
      FormsModule,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: options,
      },
      mockProvider(MatDialogRef),
    ],
  });

  describe('basic usage', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows dialog title', () => {
      expect(spectator.query('h1')).toHaveText(options.title);
    });

    it('shows dialog message', () => {
      expect(spectator.query('.message-content')).toHaveText(options.message);
    });

    it('shows a submit button', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: options.buttonText }));
      expect(button).toBeTruthy();
    });

    it('shows a cancel button', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: options.cancelText }));
      expect(button).toBeTruthy();
    });

    it('shows a confirmation checkbox', async () => {
      const checkbox = await loader.getHarness(MatCheckboxHarness.with({ label: options.confirmationCheckboxText }));
      expect(checkbox).toBeTruthy();
    });

    it('closes dialog with false when Close button is pressed', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: options.cancelText }));
      await button.click();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(false);
    });

    it('closes dialog with true when confirmation checkbox is ticked and Submit button is pressed', async () => {
      const checkbox = await loader.getHarness(MatCheckboxHarness.with({ label: options.confirmationCheckboxText }));
      await checkbox.check();

      const button = await loader.getHarness(MatButtonHarness.with({ text: options.buttonText }));
      await button.click();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    });
  });

  describe('disabling elements', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              ...options,
              hideCheckbox: true,
              hideCancel: true,
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not show a confirmation checkbox if hideCheckbox is true', async () => {
      const checkbox = await loader.getHarnessOrNull(MatCheckboxHarness.with({
        label: options.confirmationCheckboxText,
      }));
      expect(checkbox).toBeNull();
    });

    it('allows submit button to be pressed when hideCheckbox is set to false', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: options.buttonText }));
      await button.click();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    });

    it('does not show a cancel button if hideCancel is true', async () => {
      const button = await loader.getHarnessOrNull(MatButtonHarness.with({ text: options.cancelText }));
      expect(button).toBeNull();
    });
  });

  describe('secondary checkbox', () => {
    const secondaryCheckboxOptions = {
      ...options,
      secondaryCheckbox: true,
      secondaryCheckboxText: 'Secondary checkbox',
    } as ConfirmOptionsWithSecondaryCheckbox;

    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: secondaryCheckboxOptions,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows a secondary checkbox', async () => {
      const checkbox = await loader.getHarness(MatCheckboxHarness.with({
        label: secondaryCheckboxOptions.secondaryCheckboxText,
      }));
      expect(checkbox).toBeTruthy();
    });

    it('closes dialog with an object when confirmation checkbox is ticked and Submit button is pressed', async () => {
      const checkbox = await loader.getHarness(MatCheckboxHarness.with({ label: options.confirmationCheckboxText }));
      await checkbox.check();

      const secondaryCheckbox = await loader.getHarness(MatCheckboxHarness.with({
        label: secondaryCheckboxOptions.secondaryCheckboxText,
      }));
      await secondaryCheckbox.check();

      const button = await loader.getHarness(MatButtonHarness.with({ text: options.buttonText }));
      await button.click();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
        confirmed: true,
        secondaryCheckbox: true,
      });
    });

    it('closes dialog with an object when cancel button is pressed', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: options.cancelText }));
      await button.click();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
        confirmed: false,
        secondaryCheckbox: false,
      });
    });
  });

  describe('secondary checkbox present, but false', () => {
    const secondaryCheckboxOptions = {
      ...options,
      secondaryCheckbox: false,
      secondaryCheckboxText: 'Secondary checkbox',
    } as ConfirmOptionsWithSecondaryCheckbox;

    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: secondaryCheckboxOptions,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('closes dialog with an object even when `secondaryCheckbox` is false, but present in options', async () => {
      const checkbox = await loader.getHarness(MatCheckboxHarness.with({ label: options.confirmationCheckboxText }));
      await checkbox.check();

      const button = await loader.getHarness(MatButtonHarness.with({ text: options.buttonText }));
      await button.click();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
        confirmed: true,
        secondaryCheckbox: false,
      });
    });
  });
});
