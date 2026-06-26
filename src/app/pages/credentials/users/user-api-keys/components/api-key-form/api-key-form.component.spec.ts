import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnDateInputHarness, TnDialog, TnInputHarness,
} from '@truenas/ui-components';
import { parseISO } from 'date-fns';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiKey } from 'app/interfaces/api-key.interface';
import {
  DialogService,
} from 'app/modules/dialog/dialog.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApiKeyFormComponent } from 'app/pages/credentials/users/user-api-keys/components/api-key-form/api-key-form.component';
import { KeyCreatedDialog } from 'app/pages/credentials/users/user-api-keys/components/key-created-dialog/key-created-dialog.component';

describe('ApiKeyFormComponent', () => {
  let spectator: Spectator<ApiKeyFormComponent>;
  let loader: HarnessLoader;

  const editingKey = {
    id: 1,
    name: 'existing key',
    username: 'root',
    expires_at: { $date: parseISO('2024-11-22T00:00:00Z').getTime() },
  } as ApiKey;

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
      mockProvider(DialogRef),
      mockProvider(DialogService),
      mockProvider(LocaleService, {
        timezone: 'UTC',
        getDateFromString: (date: string) => parseISO(date),
      }),
    ],
  });

  // The form's username control is bound to an `ix-user-picker`, and `tn-date-input` formatting is
  // locale/timezone dependent; read both from the form model instead of the rendered controls.
  function rawForm(): { username: string; expires_at: Date | null } {
    return (spectator.component as unknown as {
      form: { getRawValue(): { username: string; expires_at: Date | null } };
    }).form.getRawValue();
  }

  async function setupTest(
    inputs: Partial<{ editingKey: ApiKey; presetUsername: string }> = {},
  ): Promise<void> {
    spectator = createComponent({ props: inputs });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jest.spyOn(spectator.inject(TnDialog), 'open').mockImplementation();
    await spectator.fixture.whenStable();
  }

  it('creates a new API key and shows it when opened with no data', async () => {
    await setupTest();
    const closedSpy = jest.spyOn(spectator.component.closed, 'emit');

    const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
    await nameInput.setValue('My key');

    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('api_key.create', [{
      name: 'My key',
      username: 'root',
      expires_at: null,
    }]);
    expect(closedSpy).toHaveBeenCalledWith(true);
    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(KeyCreatedDialog, {
      data: 'generated-key',
    });
  });

  it('shows values for the existing key when opened for edit', async () => {
    await setupTest({ editingKey });

    const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
    const nonExpiring = await loader.getHarness(TnCheckboxHarness.with({ label: 'Non-expiring' }));

    expect(await nameInput.getValue()).toBe('existing key');
    expect(await nonExpiring.isChecked()).toBe(false);
    expect(rawForm().username).toBe('root');
    expect(rawForm().expires_at?.getTime()).toBe(editingKey.expires_at?.$date);
  });

  it('edits key name when opened with existing api key', async () => {
    await setupTest({ editingKey });
    const closedSpy = jest.spyOn(spectator.component.closed, 'emit');

    const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
    await nameInput.setValue('My key');
    const nonExpiring = await loader.getHarness(TnCheckboxHarness.with({ label: 'Non-expiring' }));
    await nonExpiring.check();

    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('api_key.update', [1, {
      name: 'My key',
      reset: false,
      expires_at: null,
    }]);
    expect(closedSpy).toHaveBeenCalledWith(true);
    expect(spectator.inject(TnDialog).open).not.toHaveBeenCalledWith(KeyCreatedDialog, {
      data: 'generated-key',
    });
  });

  it('disables username on edit', async () => {
    await setupTest({ editingKey });

    expect(
      (spectator.component as unknown as { form: { controls: { username: { disabled: boolean } } } })
        .form.controls.username.disabled,
    ).toBe(true);
  });

  it('allows existing api key to be reset and shows newly generated key', async () => {
    await setupTest({ editingKey });
    const closedSpy = jest.spyOn(spectator.component.closed, 'emit');
    spectator.inject(MockApiService).mockCallOnce('api_key.update', { key: 'generated-key' } as ApiKey);

    const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
    await nameInput.setValue('My key');
    const nonExpiring = await loader.getHarness(TnCheckboxHarness.with({ label: 'Non-expiring' }));
    await nonExpiring.uncheck();
    // `tn-date-input` round-trips through a date-only display, so set/expect the same local-midnight
    // Date (timezone-independent) rather than a fixed UTC instant.
    const expiresOnDate = new Date(2024, 11, 22);
    const expiresOn = await loader.getHarness(TnDateInputHarness);
    await expiresOn.setValue(expiresOnDate);
    const reset = await loader.getHarness(TnCheckboxHarness.with({ label: 'Reset' }));
    await reset.check();

    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('api_key.update', [1, {
      name: 'My key',
      reset: true,
      expires_at: {
        $date: expiresOnDate.getTime(),
      },
    }]);
    expect(closedSpy).toHaveBeenCalledWith(true);
    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(KeyCreatedDialog, {
      data: 'generated-key',
    });
  });

  describe('username field on new api key', () => {
    it('sets current username when no username is provided', async () => {
      await setupTest();

      expect(rawForm().username).toBe('root');
    });

    it('sets username from the presetUsername input when provided', async () => {
      await setupTest({ presetUsername: 'testuser' });

      expect(rawForm().username).toBe('testuser');
    });
  });
});
