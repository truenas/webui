import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { KiB } from 'app/constants/bytes.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
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
    user_properties: {
      comments: {
        parsed: 'comments',
        rawvalue: 'comments',
        value: 'comments',
        source: ZfsPropertySource.Inherited,
      },
    } as Record<string, ZfsProperty<string>>,
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
    copies: {
      value: '1',
      parsed: 1,
      source: ZfsPropertySource.Inherited,
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
    user_properties: {
      comments: {
        parsed: 'comments',
        rawvalue: 'comments',
        value: 'comments',
        source: ZfsPropertySource.Local,
      },
    } as Record<string, ZfsProperty<string>>,
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
    copies: {
      value: '1',
      parsed: 1,
      source: ZfsPropertySource.Default,
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
      mockApi([
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
      mockProvider(SystemGeneralService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string, params?: Record<string, string>) => {
          // Handle template strings with interpolation
          if (key === 'Inherit ({value})' && params?.value) {
            return `Inherit (${String(params.value)})`;
          }
          // Return key as-is (translations are already in title case from the service)
          return key;
        }),
        get: jest.fn((key: string, params?: Record<string, string>) => {
          if (key === 'Inherit ({value})' && params?.value) {
            return of(`Inherit (${String(params.value)})`);
          }
          return of(key);
        }),
        onTranslationChange: { subscribe: jest.fn() },
        onLangChange: { subscribe: jest.fn() },
        onDefaultLangChange: { subscribe: jest.fn() },
      }),
      provideMockStore({
        initialState: {
          systemInfo: {
            productType: ProductType.CommunityEdition,
            license: {
              features: [],
            },
          } as unknown as SystemInfo,
        },
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

      expect(await form.getValues()).toEqual({
        Comments: '',
        'Compression Level': 'LZJB',
        'Enable Atime': 'Inherit (Off)',
        Sync: 'Inherit (Standard)',
        'ZFS Deduplication': 'Inherit (Off)',
        'Case Sensitivity': 'Sensitive',
        Checksum: 'SHA256',
        'Read-only': 'Off',
        Exec: 'Inherit (On)',
        'Snapshot Directory': 'Inherit (Hidden)',
        Snapdev: 'Hidden',
        Copies: 'Inherit (1)',
        'Record Size': 'Inherit (128K)',
        'ACL Type': 'POSIX',
        'ACL Mode': 'Discard',
        'Use Metadata (Special) VDEVs': 'Inherit (0)',
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
        copies: inherit,
        deduplication: inherit,
        exec: inherit,
        readonly: OnOff.Off,
        recordsize: inherit,
        snapdev: DatasetSnapdev.Hidden,
        snapdir: inherit,
        special_small_block_size: inherit,
        aclmode: AclMode.Discard,
        acltype: DatasetAclType.Posix,
      });
    });

    it('sends INHERIT for snapdir when form value is INHERIT', () => {
      spectator.setInput({
        existing: existingDataset,
        parent: parentDataset,
      });

      spectator.component.form.patchValue({
        snapdir: inherit,
      });

      const payload = spectator.component.getPayload();
      expect(payload.snapdir).toBe(inherit);
    });

    it('sends INHERIT for copies when form value is INHERIT', () => {
      spectator.setInput({
        existing: existingDataset,
        parent: parentDataset,
      });

      spectator.component.form.patchValue({
        copies: inherit,
      });

      const payload = spectator.component.getPayload();
      expect(payload.copies).toBe(inherit);
    });

    it('sends specific value for copies when explicitly set', () => {
      spectator.setInput({
        existing: existingDataset,
        parent: parentDataset,
      });

      spectator.component.form.patchValue({
        copies: 2,
      });

      const payload = spectator.component.getPayload();
      expect(payload.copies).toBe(2);
    });

    it('sends specific value for snapdir when explicitly set', () => {
      spectator.setInput({
        existing: existingDataset,
        parent: parentDataset,
      });

      spectator.component.form.patchValue({
        snapdir: DatasetSnapdir.Visible,
      });

      const payload = spectator.component.getPayload();
      expect(payload.snapdir).toBe(DatasetSnapdir.Visible);
    });
  });

  describe('creating a new dataset', () => {
    it('shows default values when creating a new dataset', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      expect(await form.getValues()).toEqual({
        Comments: '',
        Sync: 'Inherit (Standard)',
        'Compression Level': 'Inherit (LZJB)',
        'Enable Atime': 'Inherit (Off)',
        'ZFS Deduplication': 'Inherit (Off)',
        'Case Sensitivity': 'Sensitive',
        Checksum: 'Inherit (On)',
        'ACL Mode': 'Inherit',
        'ACL Type': 'Inherit',
        Copies: 'Inherit (1)',
        Exec: 'Inherit (On)',
        'Use Metadata (Special) VDEVs': 'Inherit (0)',
        'Read-only': 'Inherit (Off)',
        'Record Size': 'Inherit (128K)',
        Snapdev: 'Inherit (Hidden)',
        'Snapshot Directory': 'Inherit (Hidden)',
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
        helptextDatasetForm.aclTypeChangeWarning,
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

    it('shows deduplication field based on product type and license', async () => {
      // Default state (CommunityEdition) should show deduplication
      expect(await form.getLabels()).toContain('ZFS Deduplication');

      // Test with Enterprise with dedup license - should show
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectSystemInfo, {
        productType: ProductType.Enterprise,
        license: {
          features: [LicenseFeature.Dedup],
        },
      } as unknown as SystemInfo);
      store$.refreshState();

      const testSpectator = createComponent();
      testSpectator.setInput({
        advancedMode: true,
      });

      // Wait for all async operations including nested subscriptions
      await testSpectator.fixture.whenStable();
      testSpectator.detectChanges();
      await testSpectator.fixture.whenStable();

      const testLoader = TestbedHarnessEnvironment.loader(testSpectator.fixture);
      const testForm = await testLoader.getHarness(IxFieldsetHarness);

      expect(await testForm.getLabels()).toContain('ZFS Deduplication');
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

  describe('Use Metadata (Special) VDEVs', () => {
    it('sends inherit when set to Inherit', () => {
      spectator.setInput({
        parent: parentDataset,
      });

      // Inherit is the default value
      const payload = spectator.component.getPayload();
      expect(payload.special_small_block_size).toBe(inherit);
    });

    it('sends 0 when set to Off', () => {
      spectator.setInput({
        parent: parentDataset,
      });

      spectator.component.form.patchValue({
        special_small_block_size: OnOff.Off,
      });

      const payload = spectator.component.getPayload();
      expect(payload.special_small_block_size).toBe(0);
    });

    it('sends 16 MiB when set to On but not customized', () => {
      spectator.setInput({
        parent: parentDataset,
      });

      spectator.component.form.patchValue({
        special_small_block_size: OnOff.On,
      });

      const payload = spectator.component.getPayload();
      expect(payload.special_small_block_size).toBe(16777216); // 16 MiB in bytes
    });

    it('shows threshold field when set to On', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      await form.fillForm({
        'Use Metadata (Special) VDEVs': 'On',
      });

      expect(spectator.query('ix-input[formControlName="special_small_block_size_custom"]')).toExist();
    });

    it('sends custom value when specified', () => {
      spectator.setInput({
        parent: parentDataset,
      });

      spectator.component.form.patchValue({
        special_small_block_size: OnOff.On,
        special_small_block_size_custom: 131072, // 128 KiB
      });

      const payload = spectator.component.getPayload();
      expect(payload.special_small_block_size).toBe(131072);
    });

    describe('editing existing dataset', () => {
      it('shows Off when existing dataset has special_small_block_size set to 0', () => {
        const datasetWithZero = {
          ...existingDataset,
          special_small_block_size: {
            value: '0',
            source: ZfsPropertySource.Local,
          },
        } as Dataset;

        spectator.setInput({
          existing: datasetWithZero,
          parent: parentDataset,
        });

        expect(spectator.component.form.value.special_small_block_size).toBe(OnOff.Off);
      });

      it('shows On with custom value when existing dataset has special_small_block_size set to 128K', () => {
        const datasetWith128K = {
          ...existingDataset,
          special_small_block_size: {
            value: '131072',
            source: ZfsPropertySource.Local,
          },
        } as Dataset;

        spectator.setInput({
          existing: datasetWith128K,
          parent: parentDataset,
        });

        expect(spectator.component.form.value.special_small_block_size).toBe(OnOff.On);
        expect(spectator.component.form.value.special_small_block_size_custom).toBe(131072);
      });

      it('sends inherit when changing from local value to Inherit', () => {
        const datasetWith128K = {
          ...existingDataset,
          special_small_block_size: {
            value: '131072',
            source: ZfsPropertySource.Local,
          },
        } as Dataset;

        spectator.setInput({
          existing: datasetWith128K,
          parent: parentDataset,
        });

        // Verify it starts as ON
        expect(spectator.component.form.value.special_small_block_size).toBe(OnOff.On);

        // Change to Inherit
        spectator.component.form.patchValue({
          special_small_block_size: inherit,
        });

        const payload = spectator.component.getPayload();
        expect(payload.special_small_block_size).toBe(inherit);
      });

      it('shows On when existing dataset has special_small_block_size = 16 MiB (default)', () => {
        const datasetWith16M = {
          ...existingDataset,
          special_small_block_size: {
            value: (16 * 1024 * 1024).toString(),
            source: ZfsPropertySource.Local,
          },
        } as Dataset;

        spectator.setInput({
          existing: datasetWith16M,
          parent: parentDataset,
        });

        expect(spectator.component.form.value.special_small_block_size).toBe(OnOff.On);
        expect(spectator.component.form.value.special_small_block_size_custom).toBe(16777216);
      });
    });
  });
});
