import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import {
  SaveConfigDialogComponent,
} from 'app/pages/system/general-settings/save-config-dialog/save-config-dialog.component';
import { DialogService, StorageService, WebSocketService } from 'app/services';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('SaveConfigDialogComponent', () => {
  let spectator: Spectator<SaveConfigDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SaveConfigDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('core.download', [123, 'http://localhost/download/config']),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              hostname: 'truenas',
              version: 'TrueNAS-SCALE-22.12',
            } as SystemInfo,
          },
        ],
      }),
      mockProvider(DatePipe, {
        transform: () => '20220524160228',
      }),
      mockProvider(StorageService, {
        downloadUrl: jest.fn(() => of(undefined)),
      }),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('saves configuration when save dialog is submitted', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('core.download', [
      'config.save',
      [{ secretseed: false }],
      'truenas-TrueNAS-SCALE-22.12-20220524160228.db',
    ]);
    expect(spectator.inject(StorageService).downloadUrl).toHaveBeenCalledWith(
      'http://localhost/download/config',
      'truenas-TrueNAS-SCALE-22.12-20220524160228.db',
      'application/x-sqlite3',
    );
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('saves configuration together with password seed when dialog is submitted with Export checkbox', async () => {
    const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Export Password Secret Seed' }));
    await checkbox.setValue(true);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('core.download', [
      'config.save',
      [{ secretseed: true }],
      'truenas-TrueNAS-SCALE-22.12-20220524160228.tar',
    ]);
    expect(spectator.inject(StorageService).downloadUrl).toHaveBeenCalledWith(
      'http://localhost/download/config',
      'truenas-TrueNAS-SCALE-22.12-20220524160228.tar',
      'application/x-tar',
    );
  });
});
