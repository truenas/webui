import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { DatasetRolesCellComponent } from 'app/pages/datasets/components/dataset-node/dataset-roles-cell/dataset-roles-cell.component';

describe('DatasetRolesCellComponent', () => {
  let spectator: Spectator<DatasetRolesCellComponent>;
  let ixIcon: IxIconHarness;

  const createComponent = createComponentFactory({
    component: DatasetRolesCellComponent,
    imports: [
      IxIconModule,
      MatIconTestingModule,
    ],
  });

  async function setupTest(dataset: DatasetDetails, isSystemDataset = false): Promise<void> {
    spectator = createComponent({
      props: {
        dataset,
        isSystemDataset,
      },
    });

    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ixIcon = await loader.getHarness(IxIconHarness).catch(() => undefined);
  }

  it('shows "Root Dataset" when dataset on the first level', async () => {
    await setupTest({ name: 'root' } as DatasetDetails, false);

    expect(spectator.query('span')).toHaveExactText('Root Dataset');
  });

  it('shows "System Dataset" when dataset is marked as system', async () => {
    await setupTest({ name: 'root/dataset' } as DatasetDetails, true);

    expect(spectator.query('span')).toHaveExactText('System Dataset');
  });

  it('shows "Root & System Dataset" when the root dataset is marked as system', async () => {
    await setupTest({ name: 'root' } as DatasetDetails, true);

    expect(spectator.query('span')).toHaveExactText('Root & System Dataset');
  });

  it('shows "Applications" icon when dataset has apps or name `ix-applications`', async () => {
    await setupTest({ name: 'root/ix-applications' } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('apps');
  });

  it('shows "Share" icon when dataset or children has shares', async () => {
    await setupTest({
      name: 'root/shares',
      children: [{
        name: 'root/shares/sub',
        smb_shares: [{}],
      }],
    } as DatasetDetails, false);

    expect(spectator.component.hasShares).toBeTruthy();
    expect(await ixIcon.getName()).toBe('share');
  });

  it('shows "VM" icon when dataset has VMs', async () => {
    await setupTest({ name: 'root', vms: [{}] } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('computer');
  });

  it('shows "SMB Share" icon for dataset', async () => {
    await setupTest({
      name: 'root/smb-share',
      smb_shares: [{}],
    } as DatasetDetails, false);

    expect(await ixIcon.getNamespace()).toBe('ix');
    expect(await ixIcon.getName()).toBe('smb_share');
  });

  it('shows "NFS Share" icon for dataset', async () => {
    await setupTest({
      name: 'root/nfs-share',
      nfs_shares: [{}],
    } as DatasetDetails, false);

    expect(await ixIcon.getNamespace()).toBe('ix');
    expect(await ixIcon.getName()).toBe('nfs_share');
  });

  it('shows "iSCSI Share" icon for dataset', async () => {
    await setupTest({
      name: 'root/iscsi-shares',
      iscsi_shares: [{}],
    } as DatasetDetails, false);

    expect(await ixIcon.getNamespace()).toBe('ix');
    expect(await ixIcon.getName()).toBe('iscsi_share');
  });

  it('shows "SMB/NFS/iSCSI" icons when dataset all shares', async () => {
    await setupTest({
      name: 'root/shares',
      smb_shares: [{}],
      nfs_shares: [{}],
      iscsi_shares: [{}],
    } as DatasetDetails, false);
  });
});
