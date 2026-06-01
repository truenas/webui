import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule } from '@angular/forms';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialogHarness } from '@truenas/ui-components';
import { ConfirmOptions, ConfirmOptionsWithSecondaryCheckbox } from 'app/interfaces/dialog.interface';
import { ConfirmDialog } from 'app/modules/dialog/components/confirm-dialog/confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let spectator: Spectator<ConfirmDialog>;
  let loader: HarnessLoader;
  const options = {
    title: 'Launch nukes?',
    message: 'Are you sure you want to launch nukes?',
    buttonText: 'Launch',
    cancelText: 'Do not launch',
    confirmationCheckboxText: 'Yeah whatever',
  } as ConfirmOptions;
  const createComponent = createComponentFactory({
    component: ConfirmDialog,
    imports: [
      FormsModule,
    ],
    providers: [
      {
        provide: DIALOG_DATA,
        useValue: options,
      },
      mockProvider(DialogRef),
    ],
  });

  describe('basic usage', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows dialog title', async () => {
      const dialog = await loader.getHarness(TnDialogHarness);
      expect(await dialog.getTitle()).toBe(options.title!);
    });

    it('shows dialog message', () => {
      expect(spectator.query('.message-content')).toHaveText(options.message);
    });

    it('shows a submit button', async () => {
      const button = await loader.getHarness(TnButtonHarness.with({ label: options.buttonText }));
      expect(button).toBeTruthy();
    });

    it('shows a cancel button', async () => {
      const button = await loader.getHarness(TnButtonHarness.with({ label: options.cancelText }));
      expect(button).toBeTruthy();
    });

    it('shows a confirmation checkbox', async () => {
      const checkbox = await loader.getHarness(MatCheckboxHarness.with({ label: options.confirmationCheckboxText }));
      expect(checkbox).toBeTruthy();
    });

    it('closes dialog with false when Close button is pressed', async () => {
      const button = await loader.getHarness(TnButtonHarness.with({ label: options.cancelText }));
      await button.click();
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(false);
    });

    it('closes dialog with true when confirmation checkbox is ticked and Submit button is pressed', async () => {
      const checkbox = await loader.getHarness(MatCheckboxHarness.with({ label: options.confirmationCheckboxText }));
      await checkbox.check();

      const button = await loader.getHarness(TnButtonHarness.with({ label: options.buttonText }));
      await button.click();
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
    });
  });

  describe('disabling elements', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: DIALOG_DATA,
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
      const button = await loader.getHarness(TnButtonHarness.with({ label: options.buttonText }));
      await button.click();
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
    });

    it('does not show a cancel button if hideCancel is true', async () => {
      const button = await loader.getHarnessOrNull(TnButtonHarness.with({ label: options.cancelText }));
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
            provide: DIALOG_DATA,
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

      const button = await loader.getHarness(TnButtonHarness.with({ label: options.buttonText }));
      await button.click();
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
        confirmed: true,
        secondaryCheckbox: true,
      });
    });

    it('closes dialog with an object when cancel button is pressed', async () => {
      const button = await loader.getHarness(TnButtonHarness.with({ label: options.cancelText }));
      await button.click();
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
        confirmed: false,
        secondaryCheckbox: false,
      });
    });
  });

  describe('default title', () => {
    const optionsWithoutTitle = {
      message: 'Are you sure you want to launch nukes?',
      buttonText: 'Launch',
      cancelText: 'Do not launch',
      confirmationCheckboxText: 'Yeah whatever',
    } as ConfirmOptions;

    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: DIALOG_DATA,
            useValue: optionsWithoutTitle,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows default title when none is provided', async () => {
      const dialog = await loader.getHarness(TnDialogHarness);
      expect(await dialog.getTitle()).toBe('Please confirm');
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
            provide: DIALOG_DATA,
            useValue: secondaryCheckboxOptions,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('closes dialog with an object even when `secondaryCheckbox` is false, but present in options', async () => {
      const checkbox = await loader.getHarness(MatCheckboxHarness.with({ label: options.confirmationCheckboxText }));
      await checkbox.check();

      const button = await loader.getHarness(TnButtonHarness.with({ label: options.buttonText }));
      await button.click();
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
        confirmed: true,
        secondaryCheckbox: false,
      });
    });
  });

  describe('secondary checkbox message', () => {
    const secondaryCheckboxOptions = {
      ...options,
      secondaryCheckbox: true,
      secondaryCheckboxText: 'Delete associated items',
      secondaryCheckboxMessage: 'This will also delete:<br>• Item 1<br>• Item 2',
    } as ConfirmOptionsWithSecondaryCheckbox;

    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: DIALOG_DATA,
            useValue: secondaryCheckboxOptions,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not show secondary message when secondary checkbox is unchecked', () => {
      const secondaryMessage = spectator.query('.secondary-message');
      expect(secondaryMessage).not.toExist();
    });

    it('shows secondary message when secondary checkbox is checked', async () => {
      const secondaryCheckbox = await loader.getHarness(MatCheckboxHarness.with({
        label: secondaryCheckboxOptions.secondaryCheckboxText,
      }));
      await secondaryCheckbox.check();
      spectator.detectChanges();

      const secondaryMessage = spectator.query('.secondary-message');
      expect(secondaryMessage).toExist();
      expect(secondaryMessage).toContainText('This will also delete:');
      expect(secondaryMessage).toContainText('Item 1');
      expect(secondaryMessage).toContainText('Item 2');
    });

    it('hides secondary message when secondary checkbox is unchecked after being checked', async () => {
      const secondaryCheckbox = await loader.getHarness(MatCheckboxHarness.with({
        label: secondaryCheckboxOptions.secondaryCheckboxText,
      }));

      // Check it
      await secondaryCheckbox.check();
      spectator.detectChanges();
      expect(spectator.query('.secondary-message')).toExist();

      // Uncheck it
      await secondaryCheckbox.uncheck();
      spectator.detectChanges();
      expect(spectator.query('.secondary-message')).not.toExist();
    });
  });

  describe('secondary checkbox without message', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: DIALOG_DATA,
            useValue: {
              ...options,
              secondaryCheckbox: true,
              secondaryCheckboxText: 'Delete associated items',
              // No secondaryCheckboxMessage
            } as ConfirmOptionsWithSecondaryCheckbox,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not show secondary message section when secondaryCheckboxMessage is not provided', () => {
      const secondaryMessage = spectator.query('.secondary-message');
      expect(secondaryMessage).not.toExist();
    });
  });
});
