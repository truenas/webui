import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { RolesCardComponent } from 'app/pages/datasets/components/roles-card/roles-card.component';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';

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

describe('RolesCardComponent', () => {
  let spectator: Spectator<RolesCardComponent>;

  const createComponent = createComponentFactory({
    providers: [
      mockAuth(),
      mockApi(),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
    ],
    component: RolesCardComponent,
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
      "Dataset is shared via SMB as 'smb1', and 'smb2'",
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
});
