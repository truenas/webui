import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { UsageCardComponent } from 'app/pages/datasets/components/usage-card/usage-card.component';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { LicenseService } from 'app/services/license.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

const datasetDummy = {
  id: '/mnt/pool/ds',
  encrypted: false,
  snapshot_count: 2,
  snapshot_tasks_count: 3,
  replication_tasks_count: 4,
  cloudsync_tasks_count: 5,
  rsync_tasks_count: 6,
  mountpoint: '/mnt/pool/ds',
  thick_provisioned: false,
} as DatasetDetails;

describe('UsageCardComponent', () => {
  let spectator: Spectator<UsageCardComponent>;

  const createComponent = createComponentFactory({
    providers: [
      mockAuth(),
      mockApi([
        mockCall('tn_connect.config', {
          id: 1,
          enabled: true,
          status: TruenasConnectStatus.Configured,
        } as TruenasConnectConfig),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(LicenseService, {
        hasLicenseOrTruenasConnect$: of(true),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: { license: null },
          },
        ],
      }),
    ],
    component: UsageCardComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        hasChildrenWithShares: true,
        systemDataset: 'pool/system-dataset',
        dataset: {
          ...datasetDummy,
          smb_shares: [
            { share_name: 'smb1', path: 'smbpath1', enabled: true },
            { share_name: 'smb2', path: 'smbpath2', enabled: true },
          ],
          nfs_shares: [{ enabled: true, path: 'nfspath' }],
          thick_provisioned: true,
          iscsi_shares: [{
            enabled: true, type: IscsiExtentType.Disk, path: 'iscsipath',
          }],
          children: [{
            ...datasetDummy,
            smb_shares: [{ share_name: 'smb', path: 'smbpath', enabled: true }],
            nfs_shares: [{ enabled: true, path: 'nfspath' }],
            thick_provisioned: true,
            iscsi_shares: [
              {
                enabled: true, type: IscsiExtentType.Disk, path: 'iscsipath',
              },
            ],
          }],
          apps: [
            { name: 'app1', path: 'app1path' },
            { name: 'app1', path: 'app1path' },
            { name: 'app2', path: 'app2path' },
          ],
          vms: [
            { name: 'vm1', path: 'vm1path' },
            { name: 'vm1', path: 'vm1path' },
            { name: 'vm2', path: 'vm2path' },
          ],
        },
      },
    });
  });

  it('shows children with shares row', () => {
    expect(spectator.query('.children-with-shares.value')).toHaveText(
      'This dataset has children with shares',
    );
  });

  it('shows smb shares row with names', () => {
    expect(
      spectator.query('.smb-shares.value'),
    ).toHaveText(
      "Dataset is shared via SMB as 'smb1' and 'smb2'",
    );
  });

  it('shows nfs shares row', () => {
    expect(
      spectator.query('.nfs-shares.value'),
    ).toHaveText(
      'Dataset is shared via NFS',
    );
  });

  it('shows iscsi shares row', () => {
    expect(
      spectator.query('.iscsi-shares.value'),
    ).toHaveText(
      'Dataset is shared via iSCSI',
    );
  });

  it('shows apps row', () => {
    expect(spectator.query('.apps.value')).toHaveText(
      'This dataset is used by: app1, app2',
    );
  });

  it('shows vms row', () => {
    expect(spectator.query('.vms.value')).toHaveText(
      'This dataset is used by: vm1, vm2',
    );
  });

  it('shows apps row when dataset has name `ix-apps`', () => {
    spectator.setInput('dataset', {
      ...datasetDummy,
      name: 'root/ix-apps',
    });
    expect(spectator.query('.apps.value')).toHaveText(
      'This dataset is used to store apps config and other container related data',
    );
  });

  it('shows system dataset row', () => {
    spectator.setInput('dataset', {
      ...datasetDummy,
      name: 'system-dataset',
    });
    spectator.setInput('systemDataset', 'system-dataset');
    expect(spectator.query('.system-dataset.value')).toHaveText(
      'This dataset is used by the system',
    );
  });

  it('shows not shared row', () => {
    spectator.setInput('dataset', {
      ...datasetDummy,
      smb_shares: [],
      nfs_shares: [],
      iscsi_shares: [],
      children: [],
      apps: [],
      vms: [],
    });
    spectator.setInput('hasChildrenWithShares', false);

    expect(spectator.query('.details-item .label')).toHaveText('Not Shared');

    const createSmbShareLink = spectator.queryAll('.details-item .action')[0] as HTMLAnchorElement;
    const createNfsShareLink = spectator.queryAll('.details-item .action')[1] as HTMLAnchorElement;

    createSmbShareLink.click();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(SmbFormComponent, {
      data: { defaultSmbShare: { path: '/mnt/pool/ds' } },
    });

    createNfsShareLink.click();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NfsFormComponent, {
      data: { defaultNfsShare: { path: '/mnt/pool/ds' } },
    });
  });

  describe('WebShare functionality', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          hasChildrenWithShares: false,
          systemDataset: 'pool/system-dataset',
          dataset: {
            ...datasetDummy,
            mountpoint: '/mnt/pool/dataset',
            name: 'pool/dataset',
            webshares: [
              { name: 'share1', path: '/mnt/pool/dataset/docs' },
              { name: 'share2', path: '/mnt/pool/dataset/media' },
            ],
          },
        },
      });
    });

    it('shows webshare row when dataset has webshares', () => {
      expect(spectator.query('.webshares.value')).toHaveText(
        "Dataset is shared via WebShare as 'share1' and 'share2'",
      );
    });

    it('shows multiple webshares with proper formatting', () => {
      spectator.setInput('dataset', {
        ...datasetDummy,
        webshares: [
          { name: 'docs', path: '/mnt/pool/dataset/docs' },
          { name: 'media', path: '/mnt/pool/dataset/media' },
          { name: 'photos', path: '/mnt/pool/dataset/photos' },
        ],
      });
      spectator.detectChanges();

      expect(spectator.query('.webshares.value')).toHaveText(
        "Dataset is shared via WebShare as 'docs', 'media' and 'photos'",
      );
    });

    it('does not show webshare row when dataset has no webshares', () => {
      spectator.setInput('dataset', {
        ...datasetDummy,
        webshares: [],
        smb_shares: [],
        nfs_shares: [],
        iscsi_shares: [],
        children: [],
        apps: [],
        vms: [],
      });
      spectator.setInput('hasChildrenWithShares', false);

      expect(spectator.query('.webshares.value')).not.toExist();
    });
  });
});
