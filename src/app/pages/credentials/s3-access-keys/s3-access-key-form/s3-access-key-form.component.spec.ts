import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnDateInputHarness, TnDialog, TnInputHarness,
} from '@truenas/ui-components';
import { parseISO } from 'date-fns';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { S3AccessKeyStatus } from 'app/enums/s3.enum';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { User } from 'app/interfaces/user.interface';
import { IxUserComboboxHarness } from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { LocaleService } from 'app/modules/language/locale.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  S3AccessKeyCredentialsDialogComponent,
} from 'app/pages/credentials/s3-access-keys/s3-access-key-credentials-dialog/s3-access-key-credentials-dialog.component';
import { S3AccessKeyFormComponent } from 'app/pages/credentials/s3-access-keys/s3-access-key-form/s3-access-key-form.component';

describe('S3AccessKeyFormComponent', () => {
  let spectator: Spectator<S3AccessKeyFormComponent>;
  let loader: HarnessLoader;

  const createdKey = {
    id: 3,
    name: 'backup-key',
    username: 'alice',
    access_key: 'AKIAEXAMPLE12345',
    secret: 'supersecretvalue',
    enabled: true,
    expires_at: null,
    status: S3AccessKeyStatus.Enabled,
  } as S3AccessKey;

  const existingKey = {
    id: 3,
    name: 'backup-key',
    username: 'alice',
    enabled: false,
    manage_buckets: true,
    expires_at: { $date: parseISO('2030-01-15T00:00:00Z').getTime() },
  } as S3AccessKey;

  const createComponent = createComponentFactory({
    component: S3AccessKeyFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([
        mockCall('user.query', [{ username: 'alice', uid: 1000 }] as User[]),
        mockCall('s3.accesskey.create', createdKey),
        mockCall('s3.accesskey.update', createdKey),
      ]),
      mockAuth(),
      mockProvider(SnackbarService),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: unknown) => source$),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({ closed: of(true) })),
      }),
      mockProvider(LocaleService, {
        timezone: 'UTC',
        getDateFromString: (date: string) => parseISO(date),
      }),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ name }),
  );

  // `ix-user-combobox` is its own CVA, so `IxFormHarness` — which indexes ix-* controls and
  // `tn-form-field`s — does not reach it. Drive it through its own harness.
  const setUser = async (username: string): Promise<void> => {
    const user = await loader.getHarness(IxUserComboboxHarness);
    await user.focus();
    await user.selectOption(username);
  };

  describe('creating an access key', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();
    });

    it('creates a key and shows its credentials', async () => {
      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);

      await (await getInput('name')).setValue('backup-key');
      await setUser('alice');
      await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Non-expiring' }))).check();
      await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Manage Buckets' }))).check();

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('s3.accesskey.create', [{
        name: 'backup-key',
        username: 'alice',
        enabled: true,
        expires_at: null,
        manage_buckets: true,
      }]);
      expect(closed).toHaveBeenCalledWith(true);
      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
        S3AccessKeyCredentialsDialogComponent,
        { data: createdKey },
      );
    });
  });

  describe('expiry', () => {
    it('creates an expiring key with the chosen date by default', async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();

      await (await getInput('name')).setValue('backup-key');
      await setUser('alice');
      // The picker stores the chosen day at local midnight, so it is set and asserted in local time.
      await (await loader.getHarness(TnDateInputHarness)).setValue(new Date(2030, 0, 15));

      spectator.component.submit();

      const api = spectator.inject(ApiService) as unknown as { call: jest.Mock };
      const [, [payload]] = api.call.mock.calls.find(([method]) => method === 's3.accesskey.create');
      const expiresAt = new Date((payload as { expires_at: { $date: number } }).expires_at.$date);
      expect([expiresAt.getFullYear(), expiresAt.getMonth() + 1, expiresAt.getDate()]).toEqual([2030, 1, 15]);
    });

    it('asks for an expiry date by default and requires it until Non-expiring is checked', async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();

      const nonExpiring = await loader.getHarness(TnCheckboxHarness.with({ label: 'Non-expiring' }));
      expect(await nonExpiring.isChecked()).toBe(false);
      expect(spectator.component.form.controls.expires_at.errors).toMatchObject({ required: true });
      expect(spectator.component.canSubmit()).toBe(false);

      await nonExpiring.check();
      expect(spectator.component.form.controls.expires_at.errors).toBeNull();
    });
  });

  describe('editing an access key', () => {
    beforeEach(async () => {
      spectator = createComponent({ props: { accessKey: existingKey } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();
    });

    it('shows existing values with the user locked', async () => {
      expect(await (await getInput('name')).getValue()).toBe('backup-key');
      const username = await getInput('username');
      expect(await username.getValue()).toBe('alice');
      expect(await username.isDisabled()).toBe(true);
      expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }))).isChecked()).toBe(false);
      expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Manage Buckets' }))).isChecked()).toBe(true);
      expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Non-expiring' }))).isChecked()).toBe(false);
    });

    it('updates the key without changing the user and does not show credentials', async () => {
      await (await getInput('name')).setValue('renamed-key');
      await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }))).check();
      await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Manage Buckets' }))).uncheck();
      await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Non-expiring' }))).check();

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('s3.accesskey.update', [3, {
        name: 'renamed-key',
        enabled: true,
        expires_at: null,
        manage_buckets: false,
      }]);
      expect(spectator.inject(TnDialog).open).not.toHaveBeenCalled();
    });
  });
});
