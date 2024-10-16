import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { KiB } from 'app/constants/bytes.constant';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AclMode } from 'app/enums/acl-type.enum';
import {
  DatasetAclType,
  DatasetCaseSensitivity, DatasetRecordSize,
  DatasetSnapdev,
  DatasetSnapdir,
  DatasetSync,
} from 'app/enums/dataset.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFieldsetHarness } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import {
  OtherOptionsSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/other-options-section/other-options-section.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('OtherOptionsSectionComponent', () => {
  let spectator: Spectator<OtherOptionsSectionComponent>;
  let loader: HarnessLoader;
  let form: IxFieldsetHarness;
  const existingDataset = {
    comments: {
      value: 'comments',
      source: ZfsPropertySource.Inherited,
      parsed: 'comments',
    },
    sync: {
      parsed: 'standard',
      source: ZfsPropertySource.Inherited,
      value: DatasetSync.Standard,
    },
    compression: {
      parsed: 'lzjb',
      value: 'LZJB',
      source: ZfsPropertySource.Local,
    },
    atime: {
      parsed: false,
      value: OnOff.Off,
      source: ZfsPropertySource.Inherited,
    },
    deduplication: {
      value: DeduplicationSetting.On,
      source: ZfsPropertySource.Inherited,
    },
    checksum: {
      value: 'SHA256',
      source: ZfsPropertySource.Local,
    },
    readonly: {
      value: OnOff.Off,
      source: ZfsPropertySource.Local,
    },
    exec: {
      value: OnOff.On,
      source: ZfsPropertySource.Inherited,
    },
    snapdir: {
      value: DatasetSnapdir.Disabled,
      source: ZfsPropertySource.Inherited,
    },
    snapdev: {
      value: DatasetSnapdev.Hidden,
      source: ZfsPropertySource.Local,
    },
    recordsize: {
      value: '1K',
      parsed: KiB,
      source: ZfsPropertySource.Inherited,
    },
    acltype: {
      value: DatasetAclType.Posix,
      source: ZfsPropertySource.Local,
    },
    aclmode: {
      value: AclMode.Discard,
      source: ZfsPropertySource.Local,
    },
    casesensitivity: {
      value: DatasetCaseSensitivity.Sensitive,
      source: ZfsPropertySource.Inherited,
    },
    special_small_block_size: {
      value: '0',
      source: ZfsPropertySource.Default,
    },
  } as Dataset;

  const parentDataset = {
    id: 'root/parent',
    comments: {
      value: 'comments',
      source: ZfsPropertySource.Local,
      parsed: 'comments',
    },
    sync: {
      parsed: 'standard',
      source: ZfsPropertySource.Default,
      value: DatasetSync.Standard,
    },
    compression: {
      parsed: 'lzjb',
      value: 'LZJB',
      source: ZfsPropertySource.Local,
    },
    atime: {
      parsed: false,
      value: OnOff.Off,
      source: ZfsPropertySource.Local,
    },
    deduplication: {
      value: DeduplicationSetting.Off,
      source: ZfsPropertySource.Default,
    },
    checksum: {
      value: 'ON',
      source: ZfsPropertySource.Default,
    },
    readonly: {
      value: OnOff.Off,
      source: ZfsPropertySource.Default,
    },
    exec: {
      value: OnOff.On,
      source: ZfsPropertySource.Local,
    },
    snapdir: {
      value: DatasetSnapdir.Hidden,
      source: ZfsPropertySource.Default,
    },
    snapdev: {
      value: DatasetSnapdev.Hidden,
      source: ZfsPropertySource.Local,
    },
    recordsize: {
      value: '128K',
      parsed: 128 * KiB,
      source: ZfsPropertySource.Default,
    },
    acltype: {
      value: DatasetAclType.Posix,
      source: ZfsPropertySource.Inherited,
    },
    aclmode: {
      value: AclMode.Discard,
      source: ZfsPropertySource.Inherited,
    },
    casesensitivity: {
      value: DatasetCaseSensitivity.Sensitive,
      source: ZfsPropertySource.None,
    },
    special_small_block_size: {
      value: '0',
      source: ZfsPropertySource.Default,
    },
  } as Dataset;

  const createComponent = createComponentFactory({
    component: OtherOptionsSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('pool.dataset.checksum_choices', {
          ON: 'ON',
          SHA256: 'SHA256',
        }),
        mockCall('pool.dataset.compression_choices', {
          LZ4: 'LZ4',
          LZJB: 'LZJB',
          OFF: 'OFF',
        }),
        mockCall('pool.dataset.recordsize_choices', ['1K', '64K']),
        mockCall('pool.dataset.recommended_zvol_blocksize', '256K' as DatasetRecordSize),
      ]),
      mockProvider(SystemGeneralService, {
        getProductType: jest.fn(() => ProductType.Scale),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {} as SystemInfo,
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    spectator.setInput({
      advancedMode: true,
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFieldsetHarness);
  });

  describe('basic options', () => {
    it('hides section in Basic mode', async () => {
      spectator.setInput('advancedMode', false);
      spectator.detectChanges();

      expect(await loader.getAllHarnesses(IxFieldsetHarness)).toHaveLength(0);
    });
  });

  describe('editing existing dataset', () => {
    it('shows form values when editing an existing dataset', async () => {
      spectator.setInput({
        existing: existingDataset,
        parent: parentDataset,
      });

      await form.fillForm({
        'Snapshot Directory': 'Visible',
      });

      expect(await form.getValues()).toEqual({
        Comments: '',
        'Compression Level': 'LZJB',
        'Enable Atime': 'Inherit (OFF)',
        Sync: 'Inherit (STANDARD)',
        'ZFS Deduplication': 'Inherit (OFF)',
        'Case Sensitivity': 'Sensitive',
        Checksum: 'SHA256',
        'Read-only': 'Off',
        Exec: 'Inherit (ON)',
        'Snapshot Directory': 'Visible',
        Snapdev: 'Hidden',
        Copies: '',
        'Record Size': 'Inherit (128 KiB)',
        'ACL Type': 'POSIX',
        'ACL Mode': 'Discard',
        'Metadata (Special) Small Block Size': 'Inherit (0)',
      });
    });

    it('returns update payload when getPayload() is called', () => {
      spectator.setInput({
        existing: existingDataset,
        parent: parentDataset,
      });

      expect(spectator.component.getPayload()).toEqual({
        comments: '',
        atime: inherit,
        compression: 'LZJB',
        sync: inherit,
        checksum: 'SHA256',
        copies: 1,
        deduplication: inherit,
        exec: inherit,
        readonly: OnOff.Off,
        recordsize: inherit,
        snapdev: DatasetSnapdev.Hidden,
        snapdir: DatasetSnapdir.Disabled,
        special_small_block_size: inherit,
        aclmode: AclMode.Discard,
        acltype: DatasetAclType.Posix,
      });
    });
  });

  describe('creating a new dataset', () => {
    it('shows default values when creating a new dataset', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      expect(await form.getValues()).toEqual({
        Comments: '',
        Sync: 'Inherit (STANDARD)',
        'Compression Level': 'Inherit (LZJB)',
        'Enable Atime': 'Inherit (OFF)',
        'ZFS Deduplication': 'Inherit (OFF)',
        'Case Sensitivity': 'Sensitive',
        Checksum: 'Inherit (ON)',
        'ACL Mode': 'Inherit',
        'ACL Type': 'Inherit',
        Copies: '1',
        Exec: 'Inherit (ON)',
        'Metadata (Special) Small Block Size': 'Inherit (0)',
        'Read-only': 'Inherit (OFF)',
        'Record Size': 'Inherit (128 KiB)',
        Snapdev: 'Inherit (HIDDEN)',
        'Snapshot Directory': '',
      });
    });

    it('shows warning if user selects "Sync" as Disabled', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      await form.fillForm({
        Sync: 'Disabled',
      });

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Warning',
          message: 'TrueNAS recommends that the sync setting always  be left to the default of "Standard" or increased to "Always". The "Disabled" setting should  not be used in production and only where data roll back by few seconds  in case of crash or power loss is not a concern.',
        }),
      );
    });
  });

  describe('ACL type', () => {
    it('shows a warning when ACL type is changed', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      await form.fillForm({
        'ACL Type': 'SMB/NFSv4',
      });
      expect(spectator.inject(DialogService).warn).toHaveBeenCalledWith(
        'ACL Types & ACL Modes',
        helptextDatasetForm.acl_type_change_warning,
      );
    });

    it('updates ACL mode when ACL type is changed', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      const aclType = await form.getControl('ACL Type') as IxSelectHarness;
      const aclMode = await form.getControl('ACL Mode') as IxSelectHarness;

      await aclType.setValue('SMB/NFSv4');
      expect(await aclMode.getValue()).toBe('Passthrough');
      expect(await aclMode.isDisabled()).toBe(false);

      await aclType.setValue('POSIX');
      expect(await aclMode.getValue()).toBe('Discard');
      expect(await aclMode.isDisabled()).toBe(true);

      await aclType.setValue('Inherit');
      expect(await aclMode.getValue()).toBe('Inherit');
      expect(await aclMode.isDisabled()).toBe(true);
    });

    it('should not disable incorrect ACL type & ACL mode setup to allow user to fix the issue in edit mode', async () => {
      spectator.setInput({
        parent: parentDataset,
        existing: {
          ...existingDataset,
          acltype: {
            value: DatasetAclType.Posix,
          } as ZfsProperty<DatasetAclType, string>,
          aclmode: {
            value: AclMode.Passthrough,
          } as ZfsProperty<AclMode, string>,
        },
      });

      const aclType = await form.getControl('ACL Type') as IxSelectHarness;
      const aclMode = await form.getControl('ACL Mode') as IxSelectHarness;

      expect(await aclMode.getValue()).toBe('Passthrough');
      expect(await aclMode.isDisabled()).toBe(false);

      expect(await aclType.getValue()).toBe('POSIX');
      expect(await aclType.isDisabled()).toBe(false);
    });
  });

  describe('ZFS Deduplication', () => {
    it('shows a warning when deduplication is enabled', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      await form.fillForm({
        'ZFS Deduplication': 'On',
      });

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: helptextDatasetForm.deduplicationWarning,
        }),
      );
    });

    it('does not show deduplication field on Enterprise systems that do not have a dedup license', async () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      jest.spyOn(systemGeneralService, 'getProductType').mockReturnValue(ProductType.ScaleEnterprise);
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectSystemInfo, {
        license: {
          features: [],
        },
      });
      spectator.component.ngOnInit();
      expect(await form.getLabels()).not.toContain('ZFS Deduplication');

      store$.overrideSelector(selectSystemInfo, {
        license: {
          features: [LicenseFeature.Dedup],
        },
      });
      spectator.component.ngOnInit();

      expect(await form.getLabels()).toContain('ZFS Deduplication');
    });
  });

  describe('recordsize warning', () => {
    it('shows a recordsize warning and switches to advanced mode when selected recordsize is less than recommended', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      jest.spyOn(spectator.component.advancedModeChange, 'emit');
      await form.fillForm({
        'Record Size': '64K',
      });

      expect(spectator.query('.recordsize-warning')).toExist();
      expect(spectator.component.advancedModeChange.emit).toHaveBeenCalled();
    });
  });
});
