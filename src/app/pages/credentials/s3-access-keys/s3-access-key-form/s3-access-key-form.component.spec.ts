import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { parseISO } from 'date-fns';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { S3AccessKeyStatus } from 'app/enums/s3.enum';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { User } from 'app/interfaces/user.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  S3AccessKeyCredentialsDialogComponent,
} from 'app/pages/credentials/s3-access-keys/s3-access-key-credentials-dialog/s3-access-key-credentials-dialog.component';
import { S3AccessKeyFormComponent } from 'app/pages/credentials/s3-access-keys/s3-access-key-form/s3-access-key-form.component';

describe('S3AccessKeyFormComponent', () => {
  let spectator: Spectator<S3AccessKeyFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

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
    expires_at: { $date: new Date('2030-01-15T00:00:00Z').getTime() },
  } as S3AccessKey;

  const slideInRef: SlideInRef<S3AccessKey | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): S3AccessKey | undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: S3AccessKeyFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([
        mockCall('user.query', [
          { username: 'alice', uid: 1000 },
          { username: 'bob', uid: 1001 },
        ] as User[]),
        mockCall('s3.accesskey.create', createdKey),
        mockCall('s3.accesskey.update', createdKey),
      ]),
      mockAuth(),
      mockProvider(SnackbarService),
      mockProvider(MatDialog),
      mockProvider(LocaleService, {
        timezone: 'UTC',
        getDateFromString: (date: string) => parseISO(date),
      }),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  describe('creating an access key', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('creates a key and shows its credentials', async () => {
      await form.fillForm({
        Name: 'backup-key',
        User: 'alice',
        'Non-expiring': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('s3.accesskey.create', [{
        name: 'backup-key',
        username: 'alice',
        enabled: true,
        expires_at: null,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true });
      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        S3AccessKeyCredentialsDialogComponent,
        { data: createdKey },
      );
    });
  });

  describe('expiry', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('creates an expiring key with the chosen date by default', async () => {
      await form.fillForm({
        Name: 'backup-key',
        User: 'alice',
        'Expires On': '2030-01-15',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('s3.accesskey.create', [{
        name: 'backup-key',
        username: 'alice',
        enabled: true,
        expires_at: { $date: Date.UTC(2030, 0, 15) },
      }]);
    });

    it('asks for an expiry date by default and requires it until Non-expiring is checked', async () => {
      expect(await form.getValues()).toMatchObject({ 'Non-expiring': false });
      expect(await form.getLabels()).toContain('Expires On');
      expect(spectator.component.form.controls.expires_at.errors).toMatchObject({ required: true });
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await form.fillForm({ Name: 'backup-key', User: 'alice' });
      expect(await saveButton.isDisabled()).toBe(true);

      await form.fillForm({ 'Non-expiring': true });

      expect(await form.getLabels()).not.toContain('Expires On');
      expect(await saveButton.isDisabled()).toBe(false);
    });
  });

  describe('editing an access key', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => existingKey }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows existing values with the user locked', async () => {
      const values = await form.getValues();
      expect(values).toMatchObject({
        Name: 'backup-key',
        User: 'alice',
        Enabled: false,
        'Non-expiring': false,
      });
      expect(await form.getDisabledState()).toMatchObject({ User: true });
    });

    it('updates the key without changing the user and does not show credentials', async () => {
      await form.fillForm({
        Name: 'renamed-key',
        Enabled: true,
        'Non-expiring': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('s3.accesskey.update', [3, {
        name: 'renamed-key',
        enabled: true,
        expires_at: null,
      }]);
      expect(spectator.inject(MatDialog).open).not.toHaveBeenCalled();
    });
  });
});
