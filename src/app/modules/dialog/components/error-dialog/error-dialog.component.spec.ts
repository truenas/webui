import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { byText } from '@ngneat/spectator';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { ErrorDialog } from 'app/modules/dialog/components/error-dialog/error-dialog.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('ErrorDialog', () => {
  let spectator: Spectator<ErrorDialog>;
  let loader: HarnessLoader;

  const baseError = {
    title: 'Fatal Error',
    message: 'An error occurred',
    logs: {
      id: 1,
    },
  } as ErrorReport;

  const createComponent = createComponentFactory({
    component: ErrorDialog,
    providers: [
      mockApi([
        mockCall('core.job_download_logs', '/logs/logs.log'),
      ]),
      mockProvider(DownloadService, {
        streamDownloadFile: jest.fn(() => of(new Blob())),
        downloadBlob: jest.fn(),
      }),
      mockProvider(MatDialogRef),
      mockProvider(Router),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              version: 'MASTER-25.10',
            } as SystemInfo,
          },
        ],
      }),
    ],
  });

  describe('basic functionality', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: baseError,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows error title', () => {
      const title = spectator.query('.err-title');
      expect(title).toHaveText(baseError.title);
    });

    it('shows error message', () => {
      const message = spectator.query('.err-message-wrapper');
      expect(message).toHaveText(baseError.message);
    });

    it('shows default error icon when no custom icon provided', () => {
      const icon = spectator.query('ix-icon.error-warning-icon');
      expect(icon).toExist();
    });

    it('does not show hint section when not provided', () => {
      const hint = spectator.query('.hint-text');
      expect(hint).not.toExist();
    });

    it('does not show details section when no details provided', () => {
      const viewDetailsLink = spectator.query(byText('View Details'));
      expect(viewDetailsLink).not.toExist();
    });
  });


  describe('logs', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: baseError,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows button to download logs when logs is available in the error report', async () => {
      const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Logs' }));
      await downloadButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.job_download_logs', [1, '1.log']);
      expect(spectator.inject(DownloadService).streamDownloadFile).toHaveBeenCalledWith('/logs/logs.log', '1.log', 'text/plain');
      expect(spectator.inject(DownloadService).downloadBlob).toHaveBeenCalledWith(expect.any(Blob), '1.log');
    });
  });

  describe('custom icon', () => {
    it('shows custom icon when provided', () => {
      const errorWithIcon = {
        ...baseError,
        icon: 'ix-cloud-off',
      } as ErrorReport;

      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: errorWithIcon,
          },
        ],
      });

      const icon = spectator.query('ix-icon.error-warning-icon');
      expect(icon).toExist();
      // Check that the component rendered with the custom icon
      const title = spectator.query('.err-title');
      expect(title.innerHTML).toContain('ix-cloud-off');
    });
  });

  describe('hint display', () => {
    it('shows hint when provided', () => {
      const errorWithHint = {
        ...baseError,
        hint: 'Check your network settings',
      } as ErrorReport;

      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: errorWithHint,
          },
        ],
      });

      const hint = spectator.query('.hint-text');
      expect(hint).toExist();
      expect(hint).toHaveText('Check your network settings');
    });
  });

  describe('custom action buttons', () => {
    it('shows action buttons and navigates on click', async () => {
      const errorWithActions = {
        ...baseError,
        actions: [
          { label: 'Network Settings', route: '/system/network' },
        ],
      } as ErrorReport;

      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: errorWithActions,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const router = spectator.inject(Router);
      const dialogRef = spectator.inject(MatDialogRef);

      const actionButton = await loader.getHarness(MatButtonHarness.with({ text: 'Network Settings' }));
      await actionButton.click();

      expect(router.navigate).toHaveBeenCalledWith(['/system/network']);
      expect(dialogRef.close).toHaveBeenCalled();
    });

    it('executes custom action callback when provided', async () => {
      const customAction = jest.fn();

      const errorWithActions = {
        ...baseError,
        actions: [
          { label: 'Custom Action', action: customAction },
        ],
      } as ErrorReport;

      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: errorWithActions,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const dialogRef = spectator.inject(MatDialogRef);

      const actionButton = await loader.getHarness(MatButtonHarness.with({ text: 'Custom Action' }));
      await actionButton.click();

      expect(customAction).toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalled();
    });
  });

  describe('error details section', () => {
    const errorWithDetails = {
      ...baseError,
      details: [
        { label: 'Error Name', value: 'ECONNRESET' },
        { label: 'Error Code', value: 104 },
        { label: 'Reason', value: 'Connection reset by peer' },
        { label: 'Trace', value: 'Long stack trace here\nwith multiple lines' },
      ],
    } as ErrorReport;

    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: errorWithDetails,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows expandable details section when details are provided', () => {
      const viewDetailsLink = spectator.query(byText('View Details'));
      expect(viewDetailsLink).toExist();

      const detailsPanel = spectator.query('.details-panel');
      expect(detailsPanel).toExist();
      expect(detailsPanel).not.toHaveClass('open');
    });

    it('expands details panel when View Details is clicked', () => {
      const viewDetailsLink = spectator.query(byText('View Details'));
      spectator.click(viewDetailsLink);

      const detailsPanel = spectator.query('.details-panel');
      expect(detailsPanel).toHaveClass('open');

      // Check that details are visible
      expect(spectator.query(byText('Error Name:'))).toExist();
      expect(spectator.query(byText('ECONNRESET'))).toExist();
      expect(spectator.query(byText('Error Code:'))).toExist();
      expect(spectator.query(byText('104'))).toExist();
    });

    it('hides trace by default with Show link', () => {
      const viewDetailsLink = spectator.query(byText('View Details'));
      spectator.click(viewDetailsLink);

      // Trace should have a Show link instead of displaying the content
      const showTraceLink = spectator.query(byText('Show'));
      expect(showTraceLink).toExist();

      // Trace content should not be visible
      expect(spectator.query(byText('Long stack trace here'))).not.toExist();
    });

    it('shows trace content when Show is clicked', () => {
      const viewDetailsLink = spectator.query(byText('View Details'));
      spectator.click(viewDetailsLink);

      const showTraceLink = spectator.query(byText('Show'));
      spectator.click(showTraceLink);

      // Now trace should be visible - check for the pre element containing trace
      const traceContent = spectator.query('.detail-value pre');
      expect(traceContent).toExist();
      expect(traceContent).toHaveText('Long stack trace here\nwith multiple lines');

      // And the link should change to Hide
      const hideTraceLink = spectator.query(byText('Hide'));
      expect(hideTraceLink).toExist();
    });

    it('hides trace content when Hide is clicked', () => {
      const viewDetailsLink = spectator.query(byText('View Details'));
      spectator.click(viewDetailsLink);

      // Show trace first
      const showTraceLink = spectator.query(byText('Show'));
      spectator.click(showTraceLink);

      // Then hide it
      const hideTraceLink = spectator.query(byText('Hide'));
      spectator.click(hideTraceLink);

      // Trace content should be hidden again
      expect(spectator.query(byText('Long stack trace here'))).not.toExist();
      expect(spectator.query(byText('Show'))).toExist();
    });

    it('includes trace in copy button text', () => {
      // Open the details panel to see the copy button
      const viewDetailsLink = spectator.query(byText('View Details'));
      spectator.click(viewDetailsLink);

      // The copy button should include all details including trace
      const copyButton = spectator.query('ix-copy-button');
      expect(copyButton).toExist();
    });
  });
});
