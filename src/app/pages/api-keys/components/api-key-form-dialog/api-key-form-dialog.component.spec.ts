import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  ApiKeyFormDialogComponent,
} from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import {
  KeyCreatedDialogComponent,
} from 'app/pages/api-keys/components/key-created-dialog/key-created-dialog.component';
import { ApiKeyComponentStore } from 'app/pages/api-keys/store/api-key.store';
import {
  DialogService,
} from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ApiKeyFormDialogComponent', () => {
  let spectator: Spectator<ApiKeyFormDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: ApiKeyFormDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('api_key.create', { key: 'generated-key' } as ApiKey),
        mockCall('api_key.update', {} as ApiKey),
      ]),
      mockProvider(ApiKeyComponentStore, {
        apiKeyAdded: jest.fn(),
        apiKeyEdited: jest.fn(),
      }),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      {
        provide: MAT_DIALOG_DATA,
        useValue: undefined,
      },
    ],
  });

  async function setupTest(apiKey?: Partial<ApiKey>): Promise<void> {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: apiKey,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    jest.spyOn(spectator.inject(MatDialog), 'open').mockImplementation();
  }

  it('creates a new API key and shows it when dialog is opened with no data', async () => {
    await setupTest(null);

    await form.fillForm({
      Name: 'My key',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call)
      .toHaveBeenCalledWith('api_key.create', [{ name: 'My key', allowlist: [{ method: '*', resource: '*' }] }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(KeyCreatedDialogComponent, { data: 'generated-key' });
  });

  it('edits key name when dialog is opened with existing api key', async () => {
    await setupTest({
      id: 1,
      name: 'existing key',
    });

    await form.fillForm({
      Name: 'My key',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('api_key.update', [1, { name: 'My key', reset: false }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(MatDialog).open).not.toHaveBeenCalledWith(KeyCreatedDialogComponent, { data: 'generated-key' });
  });

  it('allows existing api key to be reset and shows newly generated key', async () => {
    await setupTest({
      id: 1,
      name: 'existing key',
    });
    spectator.inject(MockWebsocketService).mockCallOnce('api_key.update', { key: 'generated-key' } as ApiKey);

    await form.fillForm({
      Name: 'My key',
      Reset: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('api_key.update', [1, { name: 'My key', reset: true }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(KeyCreatedDialogComponent, { data: 'generated-key' });
  });
});
