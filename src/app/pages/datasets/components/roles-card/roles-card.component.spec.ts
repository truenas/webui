import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { RolesCardComponent } from 'app/pages/datasets/components/roles-card/roles-card.component.component';

const datasetDummy: DatasetDetails = {
  id: '/mnt/pool/ds',
  encrypted: false,
  available: null,
  encryption_algorithm: null,
  snapshot_count: 2,
  snapshot_tasks_count: 3,
  replication_tasks_count: 4,
  cloudsync_tasks_count: 5,
  rsync_tasks_count: 6,
  encryption_root: null,
  key_format: null,
  key_loaded: null,
  locked: null,
  mountpoint: null,
  name: null,
  pool: null,
  type: null,
  used: null,
  quota: null,
};

describe('RolesCardComponent', () => {
  let spectator: Spectator<RolesCardComponent>;

  const createComponent = createComponentFactory({
    imports: [
      IxIconModule,
    ],
    component: RolesCardComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        hasChildrenWithShares: true,
        dataset: {
          ...datasetDummy,
          smb_shares: [
            { share_name: 'smb1', path: 'smbpath1', enabled: true },
            { share_name: 'smb2', path: 'smbpath2', enabled: true },
          ],
          nfs_shares: [{ enabled: true, path: 'nfspath' }],
          iscsi_shares: [{
            enabled: true, type: IscsiExtentType.Disk, path: 'iscsipath', thick_provisioned: true,
          }],
          children: [{
            ...datasetDummy,
            smb_shares: [{ share_name: 'smb', path: 'smbpath', enabled: true }],
            nfs_shares: [{ enabled: true, path: 'nfspath' }],
            iscsi_shares: [
              {
                enabled: true, type: IscsiExtentType.Disk, path: 'iscsipath', thick_provisioned: true,
              },
            ],
          }],
          apps: [
            { name: 'app', path: 'apppath' },
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
    expect(
      spectator.query('.apps.value'),
    ).toHaveText(
      'This dataset is used by one or more apps',
    );
  });
});
