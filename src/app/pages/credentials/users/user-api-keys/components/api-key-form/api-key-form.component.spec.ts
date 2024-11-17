import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiKey } from 'app/interfaces/api-key.interface';
import {
  DialogService,
} from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { ApiKeyFormComponent } from 'app/pages/credentials/users/user-api-keys/components/api-key-form/api-key-form.component';
import { KeyCreatedDialogComponent } from 'app/pages/credentials/users/user-api-keys/components/key-created-dialog/key-created-dialog.component';
import { ApiService } from 'app/services/websocket/api.service';

describe('ApiKeyFormComponent', () => {
  let spectator: Spectator<ApiKeyFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: ApiKeyFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('user.query', []),
        mockCall('api_key.query', []),
        mockCall('api_key.create', { key: 'generated-key' } as ApiKey),
        mockCall('api_key.update', {} as ApiKey),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(SlideInRef),
      mockProvider(DialogService),
      {
        provide: SLIDE_IN_DATA,
        useValue: undefined,
      },
    ],
  });

  async function setupTest(apiKey?: Partial<ApiKey>): Promise<void> {
    spectator = createComponent({
      providers: [
        {
          provide: SLIDE_IN_DATA,
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

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('api_key.create', [{
      name: 'My key',
      username: 'root',
      expires_at: null,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(KeyCreatedDialogComponent, {
      data: 'generated-key',
    });
  });

  it('edits key name when dialog is opened with existing api key', async () => {
    await setupTest({
      id: 1,
      name: 'existing key',
      username: 'root',
    });

    await form.fillForm({
      Name: 'My key',
      'Non-expiring': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('api_key.update', [1, {
      name: 'My key',
      reset: false,
      expires_at: null,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(MatDialog).open).not.toHaveBeenCalledWith(KeyCreatedDialogComponent, {
      data: 'generated-key',
    });
  });

  it('allows existing api key to be reset and shows newly generated key', async () => {
    await setupTest({
      id: 1,
      name: 'existing key',
      username: 'root',
    });
    spectator.inject(MockApiService).mockCallOnce('api_key.update', { key: 'generated-key' } as ApiKey);

    await form.fillForm({
      Name: 'My key',
      Reset: true,
      'Non-expiring': false,
      'Expires at': '2024-12-31T23:59:59.000Z',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('api_key.update', [1, {
      name: 'My key',
      reset: true,
      expires_at: {
        $date: NaN,
      },
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(KeyCreatedDialogComponent, {
      data: 'generated-key',
    });
  });
});
