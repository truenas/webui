import { MatIconTestingModule } from '@angular/material/icon/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { RolesCardComponent } from 'app/pages/datasets/components/roles-card/roles-card.component';

const datasetDummy = {
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
  thick_provisioned: false,
} as DatasetDetails;

describe('RolesCardComponent', () => {
  let spectator: Spectator<RolesCardComponent>;

  const createComponent = createComponentFactory({
    imports: [
      IxIconModule,
      MatIconTestingModule,
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

  it('shows apps row when dataset has name `ix-applications`', () => {
    spectator.setInput('dataset', {
      ...datasetDummy,
      name: 'root/ix-applications',
    });
    expect(spectator.query('.apps.value')).toHaveText(
      'This dataset is used to store Kubernetes config and other container related data',
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
});
