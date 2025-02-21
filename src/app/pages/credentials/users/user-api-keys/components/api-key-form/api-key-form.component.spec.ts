import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { parseISO } from 'date-fns';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiKey } from 'app/interfaces/api-key.interface';
import {
  DialogService,
} from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApiKeyFormComponent } from 'app/pages/credentials/users/user-api-keys/components/api-key-form/api-key-form.component';
import { KeyCreatedDialogComponent } from 'app/pages/credentials/users/user-api-keys/components/key-created-dialog/key-created-dialog.component';

describe('ApiKeyFormComponent', () => {
  let spectator: Spectator<ApiKeyFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const slideInRef: SlideInRef<ApiKey | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

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
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService),
      mockProvider(LocaleService, {
        timezone: 'UTC',
        getDateFromString: (date: string) => parseISO(date),
      }),
    ],
  });

  async function setupTest(apiKey?: Partial<ApiKey> | null): Promise<void> {
    spectator = createComponent({
      providers: [
        mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => apiKey) }),
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
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(KeyCreatedDialogComponent, {
      data: 'generated-key',
    });
  });

  it('shows values for the existing key when form is opened for edit', async () => {
    await setupTest({
      id: 1,
      name: 'existing key',
      username: 'root',
      expires_at: { $date: parseISO('2024-11-22T00:00:00Z').getTime() },
    });

    expect(await form.getValues()).toEqual({
      Name: 'existing key',
      'Non-expiring': false,
      Username: 'root',
      'Expires On': expect.stringMatching('2024-11-22'),
      Reset: false,
    });
  });

  it('edits key name when dialog is opened with existing api key', async () => {
    await setupTest({
      id: 1,
      name: 'existing key',
      username: 'root',
      expires_at: { $date: parseISO('2024-11-22T00:00:00Z').getTime() },
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
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
    expect(spectator.inject(MatDialog).open).not.toHaveBeenCalledWith(KeyCreatedDialogComponent, {
      data: 'generated-key',
    });
  });

  it('disables username on edit', async () => {
    await setupTest({
      id: 1,
      name: 'existing key',
      username: 'root',
      expires_at: { $date: parseISO('2024-11-22T00:00:00Z').getTime() },
    });

    const disabledFields = await form.getDisabledState();
    expect(disabledFields).toMatchObject({
      Username: true,
    });
  });

  it('allows existing api key to be reset and shows newly generated key', async () => {
    await setupTest({
      id: 1,
      name: 'existing key',
      username: 'root',
      expires_at: { $date: parseISO('2024-11-22T00:00:00Z').getTime() },
    });
    spectator.inject(MockApiService).mockCallOnce('api_key.update', { key: 'generated-key' } as ApiKey);

    await form.fillForm({
      Name: 'My key',
      Reset: true,
      'Non-expiring': false,
      'Expires On': '2024-12-22T00:00:00Z',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('api_key.update', [1, {
      name: 'My key',
      reset: true,
      expires_at: {
        $date: parseISO('2024-12-22T00:00:00Z').getTime(),
      },
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(KeyCreatedDialogComponent, {
      data: 'generated-key',
    });
  });
});
