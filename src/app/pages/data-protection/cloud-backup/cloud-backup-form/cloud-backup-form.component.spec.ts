import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnBannerHarness, TnCheckboxHarness, TnChipInputHarness, TnInputHarness, TnSelectHarness, TnSpriteLoaderService,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudsyncTransferSetting } from 'app/enums/cloudsync-transfer-setting.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  CloudCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { addNewIxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CloudBackupFormComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import {
  googlePhotosCreds,
  googlePhotosProvider,
  storjProvider,
} from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.testing.utils';
import {
  TransferModeExplanationComponent,
} from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { FilesystemService } from 'app/services/filesystem.service';

describe('CloudBackupFormComponent', () => {
  const storjCreds = {
    id: 2,
    name: 'Storj',
    provider: {
      type: CloudSyncProviderName.Storj,
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      token: 'test-token',
    },
  };

  const existingTask = {
    id: 1,
    description: 'sdf',
    path: '/mnt/my pool',
    cache_path: null,
    attributes: {
      folder: '/My Folder',
      chunk_size: 48,
    },
    pre_script: '',
    post_script: '',
    snapshot: false,
    absolute_paths: true,
    include: [],
    exclude: [],
    transfer_setting: CloudsyncTransferSetting.Performance,
    args: '',
    enabled: true,
    job: null,
    password: '1234',
    keep_last: 2,
    rate_limit: null,
    credentials: storjCreds,
    schedule: {
      minute: '0',
      hour: '0',
      dom: '*',
      month: '*',
      dow: 'sun',
    },
    locked: false,
  } as CloudBackup;

  let loader: HarnessLoader;
  let spectator: Spectator<CloudBackupFormComponent>;
  const getData = jest.fn(() => existingTask);
  const slideInRef: SlideInRef<CloudBackup | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
    swap: jest.fn(),
  };
  const createComponent = createComponentFactory({
    component: CloudBackupFormComponent,
    imports: [
      CloudCredentialsSelectComponent,
      ReactiveFormsModule,
      TransferModeExplanationComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogService),
      mockApi([
        mockCall('cloud_backup.create', existingTask),
        mockCall('cloud_backup.update', existingTask),
        mockCall('cloudsync.create_bucket'),
        mockCall('cloud_backup.transfer_setting_choices', [
          CloudsyncTransferSetting.Default,
          CloudsyncTransferSetting.Performance,
          CloudsyncTransferSetting.FastStorage,
        ]),
      ]),
      ...ixFormTestingProviders(),
      // ix-cloud-credentials-select's "Add new" directive opens a SlideIn and reads its result;
      // override the bare SlideIn mock from ixFormTestingProviders() to supply `open`.
      mockProvider(SlideIn, {
        openSlideIns: jest.fn(() => 1),
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(CloudCredentialService, {
        getCloudSyncCredentials: jest.fn(() => of([googlePhotosCreds, storjCreds])),
        getProviders: jest.fn(() => of([storjProvider, googlePhotosProvider])),
        getBuckets: jest.fn(() => of([{ Name: 'bucket1', Path: 'path_to_bucket1', Enabled: true }])),
      }),
      mockProvider(FilesystemService),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(TnSpriteLoaderService, {
        ensureSpriteLoaded: jest.fn(() => Promise.resolve(true)),
        getIconUrl: jest.fn(),
        getSafeIconUrl: jest.fn(),
        isSpriteLoaded: jest.fn(() => true),
        getSpriteConfig: jest.fn(),
      }),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  describe('adds a new cloud backup', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows an info banner with getting started guidance', async () => {
      const banner = await loader.getHarness(TnBannerHarness);
      expect(await banner.getText()).toContain('Getting Started with TrueCloud Backup');
    });

    it('disables absolute paths when snapshot is enabled and resets to false', async () => {
      await (await getCheckbox('absolute_paths')).check();
      await (await getCheckbox('snapshot')).check();

      const useAbsolutePathsControl = await getCheckbox('absolute_paths');

      expect(await useAbsolutePathsControl.isDisabled()).toBe(true);
      expect(await useAbsolutePathsControl.isChecked()).toBe(false);
    });

    it('does not call getBuckets when credentials value is ADD_NEW', fakeAsync(() => {
      const cloudCredentialService = spectator.inject(CloudCredentialService);
      cloudCredentialService.getBuckets = jest.fn(() => of([]));

      spectator.component.form.controls.credentials.setValue(addNewIxSelectValue as unknown as number);
      tick();

      expect(cloudCredentialService.getBuckets).not.toHaveBeenCalled();
    }));

    it('adds a new cloud backup task and creates a new bucket', async () => {
      await (await loader.getHarness(TnSelectHarness.with({ ancestor: '[formControlName="credentials"]' }))).selectOption('Storj (Storj)');

      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Source Path': '/mnt/my pool 2',
        'Cache Path': '/mnt/path',
        Folder: '/',
      });

      await (await getInput('description')).setValue('Cloud Backup Task With New Bucket');
      await (await getInput('password')).setValue('qwerty');
      await (await getInput('keep_last')).setValue('5');
      await (await getInput('rate_limit')).setValue('1000');
      await (await getSelect('bucket')).selectOption('Add new');
      await (await getInput('bucket_input')).setValue('brand-new-bucket');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloud_backup.create', [{
        args: '',
        attributes: { folder: '/', bucket: 'brand-new-bucket' },
        credentials: 2,
        cache_path: '/mnt/path',
        description: 'Cloud Backup Task With New Bucket',
        enabled: true,
        exclude: [],
        include: [],
        keep_last: 5,
        rate_limit: 1000,
        password: 'qwerty',
        path: '/mnt/my pool 2',
        post_script: '',
        pre_script: '',
        schedule: {
          dom: '*',
          dow: '*',
          hour: '0',
          minute: '0',
          month: '*',
        },
        snapshot: false,
        absolute_paths: false,
        transfer_setting: CloudsyncTransferSetting.Default,
      }]);
      expect(slideInRef.close).toHaveBeenCalledWith({ response: existingTask });
    });

    it('adds a new cloud backup task when new form is saved', async () => {
      await (await loader.getHarness(TnSelectHarness.with({ ancestor: '[formControlName="credentials"]' }))).selectOption('Storj (Storj)');

      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Source Path': '/mnt/my pool 2',
        Folder: '/',
      });

      await (await getInput('description')).setValue('New Cloud Backup Task');
      await (await getInput('password')).setValue('qwerty');
      await (await getInput('keep_last')).setValue('3');
      await (await getInput('rate_limit')).setValue('500');
      await (await getCheckbox('enabled')).uncheck();
      await (await getSelect('bucket')).selectOption('bucket1');
      await (await getCheckbox('snapshot')).uncheck();
      await (await getCheckbox('absolute_paths')).check();
      await (await loader.getHarness(TnChipInputHarness.with({ selector: '[formControlName="exclude"]' }))).addChip('/test');
      await (await getSelect('transfer_setting')).selectOption('Fast Storage');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('cloud_backup.create', [{
        args: '',
        attributes: { folder: '/', bucket: 'path_to_bucket1' },
        credentials: 2,
        cache_path: null,
        description: 'New Cloud Backup Task',
        enabled: false,
        exclude: ['/test'],
        include: [],
        keep_last: 3,
        rate_limit: 500,
        password: 'qwerty',
        path: '/mnt/my pool 2',
        post_script: '',
        pre_script: '',
        schedule: {
          dom: '*',
          dow: '*',
          hour: '0',
          minute: '0',
          month: '*',
        },
        snapshot: false,
        absolute_paths: true,
        transfer_setting: CloudsyncTransferSetting.FastStorage,
      }]);
      expect(slideInRef.close).toHaveBeenCalledWith({ response: existingTask });
    });
  });

  describe('edits an existing cloud backup', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData,
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing cloud backup task when it is open for edit', async () => {
      expect(await (await getInput('description')).getValue()).toBe('sdf');
      expect(await (await getInput('password')).getValue()).toBe('1234');
      expect(await (await getInput('keep_last')).getValue()).toBe('2');
      expect(await (await getInput('rate_limit')).getValue()).toBe('');
      expect(await (await getInput('pre_script')).getValue()).toBe('');
      expect(await (await getInput('post_script')).getValue()).toBe('');
      expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
      expect(await (await getCheckbox('snapshot')).isChecked()).toBe(false);
      expect(await (await getSelect('transfer_setting')).getDisplayText()).toBe('Performance');

      const sourcePath = await loader.getHarness(IxExplorerHarness.with({ label: 'Source Path' }));
      expect(await sourcePath.getValue()).toBe('/mnt/my pool');
    });

    it('saves updated cloud backup task when form opened for edit is saved', async () => {
      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Source Path': '/mnt/path1',
      });

      await (await getInput('description')).setValue('Edited description');
      await (await getInput('password')).setValue('qwerty123');
      await (await getSelect('bucket')).selectOption('bucket1');

      const useAbsolutePathsControl = await getCheckbox('absolute_paths');
      expect(await useAbsolutePathsControl.isDisabled()).toBe(true);
      expect(await useAbsolutePathsControl.isChecked()).toBe(true);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('cloud_backup.update', [1, {
        args: '',
        attributes: {
          folder: '/My Folder',
          bucket: 'path_to_bucket1',
        },
        credentials: 2,
        cache_path: null,
        description: 'Edited description',
        enabled: true,
        exclude: [],
        include: [],
        keep_last: 2,
        rate_limit: null,
        password: 'qwerty123',
        path: '/mnt/path1',
        post_script: '',
        pre_script: '',
        schedule: {
          dom: '*',
          dow: 'sun',
          hour: '0',
          minute: '0',
          month: '*',
        },
        snapshot: false,
        transfer_setting: CloudsyncTransferSetting.Performance,
      }]);
      expect(slideInRef.close).toHaveBeenCalledWith({ response: existingTask });
    });
  });

  describe('side panel host (no SlideInRef)', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SlideInRef, useValue: null },
        ],
        props: {
          backupToEdit: existingTask,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('emits closed and updates when saved via the host submit() entry point', async () => {
      const closedSpy = jest.spyOn(spectator.component.closed, 'emit');

      await (await getSelect('bucket')).selectOption('bucket1');

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloud_backup.update', [1, expect.anything()]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });
});
