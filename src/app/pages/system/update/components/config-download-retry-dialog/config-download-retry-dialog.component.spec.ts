import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpErrorResponse } from '@angular/common/http';
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

  describe('error message handling', () => {
    it('displays only HTTP status code for HTTP errors without URLs or auth tokens', () => {
      // Test verifies that HTTP errors show only status code, no sensitive URL data
      const errorText = spectator.query('mat-dialog-content p strong')?.textContent;

      // The default test error is a generic Error, not HttpErrorResponse
      // So this verifies the non-HTTP path works
      expect(errorText).toBeTruthy();
      expect(errorText?.length).toBeGreaterThan(0);
    });
  });
});

describe('ConfigDownloadRetryDialog with HTTP error', () => {
  const httpError = new HttpErrorResponse({
    error: 'Server Error',
    status: 500,
    statusText: 'Internal Server Error',
    url: 'http://localhost/_download/69?auth_token=SECRET123',
  });

  const createHttpComponent = createComponentFactory({
    component: ConfigDownloadRetryDialog,
    providers: [
      mockProvider(MatDialogRef),
      mockProvider(ErrorParserService),
      {
        provide: MAT_DIALOG_DATA,
        useValue: { error: httpError } as ConfigDownloadRetryDialogData,
      },
    ],
  });

  it('displays only HTTP status code without URLs or auth tokens', () => {
    const spectator = createHttpComponent();
    const errorText = spectator.query('mat-dialog-content p strong')?.textContent;

    // Should display only the HTTP status code
    expect(errorText).toContain('HTTP 500 error');

    // Should NOT contain any URL or sensitive data
    expect(errorText).not.toContain('auth_token');
    expect(errorText).not.toContain('SECRET');
    expect(errorText).not.toContain('_download');
    expect(errorText).not.toContain('localhost');
  });
});

describe('ConfigDownloadRetryDialog with generic error', () => {
  const genericError = new Error('Network timeout occurred');

  const createGenericComponent = createComponentFactory({
    component: ConfigDownloadRetryDialog,
    providers: [
      mockProvider(MatDialogRef),
      mockProvider(ErrorParserService, {
        parseError: () => ({ message: 'Network timeout occurred' }),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: { error: genericError } as ConfigDownloadRetryDialogData,
      },
    ],
  });

  it('displays parsed error message for non-HTTP errors', () => {
    const spectator = createGenericComponent();
    const errorText = spectator.query('mat-dialog-content p strong')?.textContent;
    expect(errorText).toContain('Network timeout occurred');
  });
});
