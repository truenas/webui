import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetRecordSize, DatasetType } from 'app/enums/dataset.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ZvolFormComponent', () => {
  let loader: HarnessLoader;
  let spectator: Spectator<ZvolFormComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: ZvolFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('pool.dataset.create'),
        mockCall('pool.dataset.update'),
        mockCall('pool.dataset.recommended_zvol_blocksize', '16K' as DatasetRecordSize),
        mockCall('pool.dataset.query', [{
          id: 'test pool',
          type: DatasetType.Filesystem,
          name: 'test pool',
          pool: 'test pool',
          encrypted: false,
          children: [],
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
        }] as Dataset[]),
        mockCall('pool.dataset.encryption_algorithm_choices', {
          'AES-128-CCM': 'AES-128-CCM',
          'AES-192-CCM': 'AES-192-CCM',
          'AES-256-CCM': 'AES-256-CCM',
          'AES-128-GCM': 'AES-128-GCM',
          'AES-192-GCM': 'AES-192-GCM',
          'AES-256-GCM': 'AES-256-GCM',
        }),
      ]),
      mockProvider(SlideInService),
      mockProvider(DialogService),
      mockProvider(SlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adds a new zvol', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              isNew: true,
              parentId: 'test pool',
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('adds a new zvol when new form is saved', fakeAsync(async (): Promise<void> => {
      spectator.tick();

      await form.fillForm(
        {
          'Zvol name': 'new zvol',
          Comments: 'comments text',
          'Size for this zvol': '2 GiB',
          Sync: 'Standard',
          'Compression level': 'lz4 (recommended)',
          'ZFS Deduplication': 'Verify',
          Sparse: true,
          'Inherit (non-encrypted)': false,
          'Read-only': 'On',
          Snapdev: 'Visible',
          'Encryption Type': 'Passphrase',
          Algorithm: 'AES-128-CCM',
          pbkdf2iters: 500000,
          Passphrase: '12345678',
          'Confirm Passphrase': '12345678',
        },
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('pool.dataset.create', [{
        name: 'test pool/new zvol',
        comments: 'comments text',
        compression: 'LZ4',
        volsize: 2147500032,
        force_size: false,
        sync: 'STANDARD',
        deduplication: 'VERIFY',
        sparse: true,
        volblocksize: '16K',
        readonly: 'ON',
        snapdev: 'VISIBLE',
        inherit_encryption: false,
        encryption: true,
        encryption_options: {
          algorithm: 'AES-128-CCM',
          passphrase: '12345678',
          pbkdf2iters: '500000',
        },
        type: 'VOLUME',
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    }));
  });

  describe('edits zvol', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              isNew: false,
              parentId: 'test pool',
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('saves updated zvol when form opened for edit is saved', fakeAsync(async (): Promise<void> => {
      spectator.tick();

      await form.fillForm({
        'Size for this zvol': '2 GiB',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('pool.dataset.update', ['test pool', {
        comments: '',
        compression: 'INHERIT',
        deduplication: 'INHERIT',
        force_size: false,
        readonly: 'INHERIT',
        snapdev: 'INHERIT',
        sync: 'INHERIT',
        volsize: 2147483648,
      }]);

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    }));
  });
});
