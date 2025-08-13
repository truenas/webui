import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  DatasetRecordSize, DatasetSnapdev, DatasetSync, DatasetType,
} from 'app/enums/dataset.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';

describe('ZvolFormComponent', () => {
  let loader: HarnessLoader;
  let spectator: Spectator<ZvolFormComponent>;
  let form: IxFormHarness;
  let mainDetails: DetailsTableHarness;

  const slideInRef: SlideInRef<{ isNew: boolean; parentId: string } | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const dataset = {
    id: 'test pool',
    type: DatasetType.Filesystem,
    name: 'test pool',
    pool: 'test pool',
    encrypted: false,
    children: [] as Dataset[],
    deduplication: {
      parsed: 'off',
      rawvalue: 'off',
      value: 'OFF',
      source: ZfsPropertySource.Default,
    },
    sync: {
      parsed: 'standard',
      rawvalue: 'standard',
      value: 'STANDARD',
      source: ZfsPropertySource.Default,
    },
    compression: {
      parsed: 'lz4',
      rawvalue: 'lz4',
      value: 'LZ4',
      source: ZfsPropertySource.Local,
    },
    readonly: {
      parsed: false,
      rawvalue: 'off',
      value: 'OFF',
      source: ZfsPropertySource.Default,
    },
    key_format: {
      parsed: 'none',
      rawvalue: 'none',
      value: null,
      source: ZfsPropertySource.Default,
    },
    encryption_algorithm: {
      parsed: 'off',
      rawvalue: 'off',
      value: null,
      source: ZfsPropertySource.Default,
    },
    pbkdf2iters: {
      parsed: '0',
      rawvalue: '0',
      value: '0',
      source: ZfsPropertySource.Default,
    },
    snapdev: {
      parsed: 'hidden',
      rawvalue: 'hidden',
      value: 'HIDDEN',
      source: ZfsPropertySource.Default,
    },
    volblocksize: {
      parsed: 65536,
      rawvalue: '65536',
      value: '64K',
      source: ZfsPropertySource.Default,
    },
    volsize: {
      parsed: 65536,
      rawvalue: '65536',
      value: '64K',
      source: ZfsPropertySource.Default,
    },
  } as Dataset;

  const createComponent = createComponentFactory({
    component: ZvolFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('pool.dataset.create'),
        mockCall('pool.dataset.update'),
        mockCall('pool.dataset.recommended_zvol_blocksize', '16K' as DatasetRecordSize),
        mockCall('pool.dataset.query', (params) => {
          if ((params[0][0] as QueryFilter<Dataset>)[2] === 'parentId') {
            return [dataset];
          }

          return [{
            ...dataset,
            type: DatasetType.Volume,
          }];
        }),
        mockCall('pool.dataset.encryption_algorithm_choices', {
          'AES-128-CCM': 'AES-128-CCM',
          'AES-192-CCM': 'AES-192-CCM',
          'AES-256-CCM': 'AES-256-CCM',
          'AES-128-GCM': 'AES-128-GCM',
          'AES-192-GCM': 'AES-192-GCM',
          'AES-256-GCM': 'AES-256-GCM',
        }),
      ]),
      mockProvider(DialogService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('adds a new zvol', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: jest.fn(() => ({ isNew: true, parentOrZvolId: 'parentId' })),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      mainDetails = await loader.getHarness(DetailsTableHarness);
    });

    it('adds a new zvol when new form is saved', async () => {
      await form.fillForm({
        Name: 'new zvol',
        Size: '2 GiB',
        Sparse: true,
        'Inherit (non-encrypted)': false,
        'Encryption Type': 'Passphrase',
        Passphrase: '12345678',
        'Confirm Passphrase': '12345678',
      });

      await mainDetails.setValues({
        Comments: 'comments text',
        Sync: 'Standard',
        Compression: 'lz4 (recommended)',
        'ZFS Deduplication': 'Verify',
        'Read-only': 'On',
        Snapdev: 'Visible',
      });

      const encryptionDetails = (await loader.getAllHarnesses(DetailsTableHarness))[1];
      await encryptionDetails.setValues({
        Algorithm: 'AES-128-CCM',
        pbkdf2iters: 500000,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('pool.dataset.create', [{
        name: 'parentId/new zvol',
        comments: 'comments text',
        compression: 'LZ4',
        volsize: 2147500032,
        force_size: false,
        sync: DatasetSync.Standard,
        deduplication: DeduplicationSetting.Verify,
        sparse: true,
        volblocksize: '16K',
        readonly: OnOff.On,
        snapdev: DatasetSnapdev.Visible,
        inherit_encryption: false,
        encryption: true,
        encryption_options: {
          algorithm: 'AES-128-CCM',
          passphrase: '12345678',
          pbkdf2iters: '500000',
        },
        type: DatasetType.Volume,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('adds a new zvol with encrypted parent', () => {
    let encryptedLoader: HarnessLoader;
    let encryptedSpectator: Spectator<ZvolFormComponent>;
    let encryptedForm: IxFormHarness;

    // Mock an encrypted parent dataset
    const encryptedParent = {
      ...dataset,
      encrypted: true,
      encryption_algorithm: {
        value: 'AES-256-GCM',
        parsed: 'AES-256-GCM',
        rawvalue: 'aes-256-gcm',
        source: ZfsPropertySource.Default,
      },
      key_format: {
        value: EncryptionKeyFormat.Hex,
        parsed: 'hex',
        rawvalue: 'hex',
        source: ZfsPropertySource.Default,
      },
    } as Dataset;

    const createComponentWithEncryptedParent = createComponentFactory({
      component: ZvolFormComponent,
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        mockApi([
          mockCall('pool.dataset.create'),
          mockCall('pool.dataset.update'),
          mockCall('pool.dataset.recommended_zvol_blocksize', '16K' as DatasetRecordSize),
          mockCall('pool.dataset.query', [encryptedParent]),
          mockCall('pool.dataset.encryption_algorithm_choices', {
            'AES-128-CCM': 'AES-128-CCM',
            'AES-192-CCM': 'AES-192-CCM',
            'AES-256-CCM': 'AES-256-CCM',
            'AES-128-GCM': 'AES-128-GCM',
            'AES-192-GCM': 'AES-192-GCM',
            'AES-256-GCM': 'AES-256-GCM',
          }),
        ]),
        mockProvider(DialogService),
        mockProvider(SlideInRef, {
          ...slideInRef,
          getData: jest.fn(() => ({ isNew: true, parentOrZvolId: 'parentId' })),
        }),
        mockAuth(),
      ],
    });

    beforeEach(async () => {
      encryptedSpectator = createComponentWithEncryptedParent();
      encryptedLoader = TestbedHarnessEnvironment.loader(encryptedSpectator.fixture);
      encryptedForm = await encryptedLoader.getHarness(IxFormHarness);
    });

    it('creates a zvol with inherited encryption when parent is encrypted', async () => {
      await encryptedForm.fillForm({
        Name: 'encrypted-zvol',
        Size: '1 GiB',
      });

      const saveButton = await encryptedLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      // Wait for the async operations to complete
      await encryptedSpectator.fixture.whenStable();

      const calls = (encryptedSpectator.inject(ApiService).call as jest.Mock).mock.calls;
      const createCall = calls.find((call) => call[0] === 'pool.dataset.create');

      expect(createCall).toBeDefined();
      expect(createCall[1][0]).toMatchObject({
        name: 'parentId/encrypted-zvol',
        type: DatasetType.Volume,
        encryption: true, // Should include encryption: true when inheriting from encrypted parent
        inherit_encryption: true,
      });
    });
  });

  describe('edits zvol', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: jest.fn(() => ({ isNew: false, parentOrZvolId: 'zvolId' })),
          }),
        ],
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      mainDetails = await loader.getHarness(DetailsTableHarness);
    });

    it('shows values for the zvol when form opened for edit', async () => {
      expect(await form.getValues()).toEqual({
        Name: 'test pool',
        'Force size': false,
        Size: '64 KiB',
      });
      expect(await mainDetails.getValues()).toEqual({
        Comments: 'Not Set',
        Compression: 'lz4 (recommended)',
        'Read-only': 'Inherit (off)',
        Snapdev: 'Inherit (hidden)',
        Sync: 'Inherit (standard)',
        'ZFS Deduplication': 'Inherit (off)',
      });
    });

    it('saves updated zvol when form opened for edit is saved', async () => {
      await form.fillForm({
        Size: '2 GiB',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('pool.dataset.update', ['zvolId', {
        comments: '',
        compression: 'LZ4',
        deduplication: 'OFF',
        force_size: false,
        readonly: 'INHERIT',
        snapdev: 'INHERIT',
        sync: 'STANDARD',
        volsize: 2147483648,
      }]);

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
