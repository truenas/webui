import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { Service } from 'app/interfaces/service.interface';
import { SmbPresets, SmbShare } from 'app/interfaces/smb-share.interface';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { DialogService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('SmbFormComponent',
  () => {
    const existingShare: SmbShare = {
      id: 1,
      purpose: 'ENHANCED_TIMEMACHINE',
      path: '/mnt/pool/ds1',
      path_suffix: '%U',
      home: false,
      name: 'pool',
      comment: '',
      ro: false,
      browsable: true,
      recyclebin: true,
      guestok: true,
      hostsallow: [],
      hostsdeny: [],
      auxsmbconf: '',
      aapl_name_mangling: false,
      abe: true,
      acl: true,
      durablehandle: true,
      streams: true,
      timemachine: true,
      vuid: 'a7bcb6cb-b2f3-4144-a5bb-e79dc7e282c4',
      shadowcopy: true,
      fsrvp: false,
      enabled: true,
      cluster_volname: '',
      locked: false,
    };

    const formLabels: { [key: string]: string } = {
      path: 'Path',
      name: 'Name',
      purpose: 'Purpose',
      comment: 'Description',
      enabled: 'Enabled',
      acl: 'Enable ACL',
      ro: 'Export Read Only',
      browsable: 'Browsable to Network Clients',
      guestok: 'Allow Guest Access',
      abe: 'Access Based Share Enumeration',
      hostsallow: 'Hosts Allow',
      hostsdeny: 'Hosts Deny',
      home: 'Use as Home Share',
      timemachine: 'Time Machine',
      afp: 'Legacy AFP Compatibility',
      shadowcopy: 'Enable Shadow Copies',
      recyclebin: 'Export Recycle Bin',
      aapl_name_mangling: 'Use Apple-style Character Encoding',
      streams: 'Enable Alternate Data Streams',
      durablehandle: 'Enable SMB2/3 Durable Handles',
      fsrvp: 'Enable FSRVP',
      path_suffix: 'Path Suffix',
      auxsmbconf: 'Auxiliary Parameters',
    };

    const presets: SmbPresets = {
      NO_PRESET: {
        verbose_name: 'No presets',
        params: {
          auxsmbconf: '',
        },
      },
      DEFAULT_SHARE: {
        verbose_name: 'Default share parameters',
        params: {
          path_suffix: '',
          home: false,
          ro: false,
          browsable: true,
          timemachine: false,
          recyclebin: false,
          abe: false,
          hostsallow: [],
          hostsdeny: [],
          aapl_name_mangling: false,
          acl: true,
          durablehandle: true,
          shadowcopy: true,
          streams: true,
          fsrvp: false,
          auxsmbconf: '',
        },
      },
      ENHANCED_TIMEMACHINE: {
        verbose_name: 'Multi-user time machine',
        params: {
          path_suffix: '%U',
          timemachine: true,
          auxsmbconf: 'zfs_core:zfs_auto_create=true\nzfs_core:base_user_quota=1T',
        },
      },
      MULTI_PROTOCOL_NFS: {
        verbose_name: 'Multi-protocol (NFSv3/SMB) shares',
        params: {
          acl: false,
          streams: false,
          durablehandle: false,
          auxsmbconf: 'oplocks = no\nlevel2 oplocks = no\nstrict locking = yes',
        },
      },
      PRIVATE_DATASETS: {
        verbose_name: 'Private SMB Datasets and Shares',
        params: {
          path_suffix: '%U',
          auxsmbconf: 'zfs_core:zfs_auto_create=true',
        },
      },
      WORM_DROPBOX: {
        verbose_name: 'SMB WORM. Files become readonly via SMB after 5 minutes',
        params: {
          path_suffix: '',
          auxsmbconf: 'worm:grace_period = 300',
        },
      },
    };

    let spectator: Spectator<SmbFormComponent>;
    let loader: HarnessLoader;
    let form: IxFormHarness;

    const createComponent = createComponentFactory({
      component: SmbFormComponent,
      imports: [
        ReactiveFormsModule,
        IxFormsModule,
      ],
      providers: [
        mockWebsocket([
          mockCall('sharing.smb.create'),
          mockCall('sharing.smb.update'),
          mockCall('sharing.smb.query', [
            { ...existingShare },
          ]),
          mockCall('service.query', [{
            service: ServiceName.Cifs,
            enable: true,
          } as Service]),
          mockCall('service.update'),
          mockCall('service.start'),
          mockCall('service.restart'),
          mockCall('sharing.smb.presets', { ...presets }),
          mockCall('filesystem.acl_is_trivial', false),
          mockCall('pool.dataset.path_in_locked_datasets', false),
        ]),
        mockProvider(IxSlideInService),
        mockProvider(FilesystemService),
        mockProvider(DialogService, {
          confirm: jest.fn(() => of(true)),
        }),
      ],
    });

    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows all the fields when Advanced Options button is pressed', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const fields = Object.keys(await form.getControlHarnessesDict());
      expect(fields).toContain('Enable ACL');
      expect(fields).toContain('Export Read Only');
      expect(fields).toContain('Browsable to Network Clients');
      expect(fields).toContain('Allow Guest Access');
      expect(fields).toContain('Access Based Share Enumeration');
      expect(fields).toContain('Hosts Allow');
      expect(fields).toContain('Hosts Deny');
      expect(fields).toContain('Use as Home Share');
      expect(fields).toContain('Time Machine');
      expect(fields).toContain('Legacy AFP Compatibility');
      expect(fields).toContain('Enable Shadow Copies');
      expect(fields).toContain('Export Recycle Bin');
      expect(fields).toContain('Use Apple-style Character Encoding');
      expect(fields).toContain('Enable Alternate Data Streams');
      expect(fields).toContain('Enable SMB2/3 Durable Handles');
      expect(fields).toContain('Enable FSRVP');
      expect(fields).toContain('Path Suffix');
      expect(fields).toContain('Auxiliary Parameters');
    });

    it('sets the correct options array for purpose field', async () => {
      const purposeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Purpose' }));
      const optionLabels = await purposeSelect.getOptionLabels();
      expect(optionLabels).toEqual([
        '--',
        'No presets',
        'Default share parameters',
        'Multi-user time machine',
        'Multi-protocol (NFSv3/SMB) shares',
        'Private SMB Datasets and Shares',
        'SMB WORM. Files become readonly via SMB after 5 minutes',
      ]);
    });

    it('should have error for duplicate share name', async () => {
      const nameControl = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
      await nameControl.setValue('pool');
      expect(await nameControl.getErrorText()).toEqual('The name "pool" is already in use.');
    });

    it('when a preset is selected, the relevent fields should be impacted', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const purposeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Purpose' }));

      const labels = await purposeSelect.getOptionLabels(); /** 1 so to Skip '--' */
      labels.splice(0, 1);
      const presetKeys = Object.keys(presets);
      const form = await loader.getHarness(IxFormHarness);
      const fields = await form.getControlHarnessesDict();

      for (let i = 0; i < labels.length; i++) {
        await purposeSelect.setValue(labels[i]);
        for (const param in presets[presetKeys[i]].params) {
          if (param === 'auxsmbconf') {
            continue;
          }
          const expectedValue = presets[presetKeys[i]].params[param as keyof SmbShare];
          const value = await fields[formLabels[param]].getValue();
          expect(value).toStrictEqual(expectedValue);
          expect(await fields[formLabels[param]].isDisabled()).toBeTruthy();
        }
      }
      expect(true).toBeTruthy();
    });
  });
