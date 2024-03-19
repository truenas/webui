import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
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
      }),
      mockProvider(DatePipe, {
        transform: () => '20220524160228',
      }),
      mockProvider(MatDialog, {
        open: () => mockEntityJobComponentRef,
      }),
      mockProvider(MatDialogRef),
      mockProvider(DownloadService, {
        streamDownloadFile: jest.fn(() => of('')),
        downloadBlob: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              hostname: 'truenas.com',
            } as SystemInfo,
          },
        ],
      }),
      mockAuth(),
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
    expect(spectator.inject(DownloadService).streamDownloadFile).toHaveBeenCalledWith(
      'http://localhost/download/url',
      'debug-truenas-20220524160228.tgz',
      'application/gzip',
    );
    expect(spectator.inject(DownloadService).downloadBlob).toHaveBeenCalled();
  });
});
