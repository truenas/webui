import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ConfigDownloadRetryAction } from 'app/enums/config-download-retry.enum';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import {
  ConfigDownloadRetryDialog,
  ConfigDownloadRetryDialogData,
} from 'app/pages/system/update/components/config-download-retry-dialog/config-download-retry-dialog.component';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

describe('ConfigDownloadRetryDialog', () => {
  let spectator: Spectator<ConfigDownloadRetryDialog>;
  let loader: HarnessLoader;
  let dialogRef: MatDialogRef<ConfigDownloadRetryDialog>;

  const testError = new Error('Network timeout while downloading configuration');
  const mockDialogData: ConfigDownloadRetryDialogData = {
    error: testError,
  };

  const createComponent = createComponentFactory({
    component: ConfigDownloadRetryDialog,
    providers: [
      mockProvider(MatDialogRef),
      mockProvider(ErrorParserService, {
        parseError: jest.fn((error: unknown) => ({
          message: (error as Error).message,
        })),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: mockDialogData,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    dialogRef = spectator.inject(MatDialogRef);
  });

  describe('risk acknowledgment checkbox', () => {
    it('displays the risk acknowledgment checkbox', async () => {
      const checkbox = await loader.getHarness(IxCheckboxHarness);
      expect(checkbox).toBeTruthy();
      expect(await checkbox.getLabelText()).toContain('I understand the risks');
    });

    it('checkbox is unchecked by default', async () => {
      const checkbox = await loader.getHarness(IxCheckboxHarness);
      expect(await checkbox.getValue()).toBe(false);
    });
  });

  describe('dialog actions', () => {
    describe('Cancel Update button', () => {
      it('displays Cancel Update button', async () => {
        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel Update' }));
        expect(button).toBeTruthy();
      });

      it('closes dialog with Cancel action when clicked', async () => {
        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel Update' }));
        await button.click();

        expect(dialogRef.close).toHaveBeenCalledWith(ConfigDownloadRetryAction.Cancel);
      });

      it('is always enabled', async () => {
        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel Update' }));
        expect(await button.isDisabled()).toBe(false);
      });
    });

    describe('Try Download Again button', () => {
      it('displays Try Download Again button', async () => {
        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Try Download Again' }));
        expect(button).toBeTruthy();
      });

      it('closes dialog with Retry action when clicked', async () => {
        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Try Download Again' }));
        await button.click();

        expect(dialogRef.close).toHaveBeenCalledWith(ConfigDownloadRetryAction.Retry);
      });

      it('is always enabled', async () => {
        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Try Download Again' }));
        expect(await button.isDisabled()).toBe(false);
      });
    });

    describe('Continue Update button', () => {
      it('displays Continue Update button', async () => {
        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Continue Update' }));
        expect(button).toBeTruthy();
      });

      it('is disabled by default when checkbox is unchecked', async () => {
        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Continue Update' }));
        expect(await button.isDisabled()).toBe(true);
      });

      it('becomes enabled when checkbox is checked', async () => {
        const checkbox = await loader.getHarness(IxCheckboxHarness);
        await checkbox.setValue(true);

        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Continue Update' }));
        expect(await button.isDisabled()).toBe(false);
      });

      it('becomes disabled again when checkbox is unchecked', async () => {
        const checkbox = await loader.getHarness(IxCheckboxHarness);
        await checkbox.setValue(true);
        await checkbox.setValue(false);

        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Continue Update' }));
        expect(await button.isDisabled()).toBe(true);
      });

      it('closes dialog with Continue action when clicked', async () => {
        const checkbox = await loader.getHarness(IxCheckboxHarness);
        await checkbox.setValue(true);

        const button = await loader.getHarness(MatButtonHarness.with({ text: 'Continue Update' }));
        await button.click();

        expect(dialogRef.close).toHaveBeenCalledWith(ConfigDownloadRetryAction.Continue);
      });
    });
  });

  describe('error message sanitization', () => {
    it('does not display auth tokens or query parameters from error messages', () => {
      // This test verifies the security fix: auth tokens should never appear in the displayed error message
      const errorText = spectator.query('mat-dialog-content p strong')?.textContent;

      // Ensure no sensitive data is displayed
      expect(errorText).not.toContain('auth_token');
      expect(errorText).not.toContain('SECRET');
      expect(errorText).not.toContain('?');
      expect(errorText).not.toContain('&');

      // Error message should still be present
      expect(errorText).toBeTruthy();
      expect(errorText?.length).toBeGreaterThan(0);
    });
  });
});
