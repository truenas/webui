import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { DownloadService } from 'app/services/download.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';
import { SaveDebugButtonComponent } from './save-debug-button.component';

describe('SaveDebugButtonComponent', () => {
  let spectator: Spectator<SaveDebugButtonComponent>;
  const createComponent = createComponentFactory({
    component: SaveDebugButtonComponent,
    providers: [
      mockWebSocket([
        mockCall('core.download', [45, 'http://localhost/download/url']),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockProvider(MatDialogRef),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(() => of('')),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              hostname: 'truenas.com',
            } as SystemInfo,
          },
          {
            selector: selectJob(45),
            value: fakeSuccessfulJob(),
          },
        ],
      }),
      mockAuth(),
    ],
    componentProviders: [
      mockProvider(DatePipe, {
        transform: () => '20220524160228',
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('saves debug with confirmation when Save Debug is pressed', async () => {
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Debug' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call)
      .toHaveBeenCalledWith('core.download', ['system.debug', [], 'debug-truenas-20220524160228.tgz', true]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(DownloadService).downloadUrl).toHaveBeenCalledWith(
      'http://localhost/download/url',
      'debug-truenas-20220524160228.tgz',
      'application/gzip',
    );
  });
});
