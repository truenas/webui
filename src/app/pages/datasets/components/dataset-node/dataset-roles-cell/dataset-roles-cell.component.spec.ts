import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatTooltip } from '@angular/material/tooltip';
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

  it('shows "System Dataset" when dataset is marked as system', async () => {
    await setupTest({ name: 'root/dataset' } as DatasetDetails, true);

    expect(await ixIcon.getNamespace()).toBe('ix');
    expect(await ixIcon.getName()).toBe('truenas_scale_logomark');
    expect(spectator.query(MatTooltip).message).toBe('This dataset is used by the system');
  });

  it('shows "Applications" icon and tooltip when dataset has name `ix-applications`', async () => {
    await setupTest({ name: 'root/ix-applications' } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('apps');
    expect(spectator.query(MatTooltip).message).toBe(
      'This dataset is used to store Kubernetes config and other container related data',
    );
  });

  it('shows "Applications" icon and tooltip when dataset has apps', async () => {
    await setupTest({ name: 'root', apps: [{ name: 'app1', path: '' }, { name: 'app1', path: '' }, { name: 'app2', path: '' }] } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('apps');
    expect(spectator.query(MatTooltip).message).toBe('This dataset is used by: app1, app2');
  });

  it('shows "VM" icon and tooltip when dataset has vms', async () => {
    await setupTest({ name: 'root', vms: [{ name: 'vm1', path: '' }, { name: 'vm1', path: '' }, { name: 'vm2', path: '' }] } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('computer');
    expect(spectator.query(MatTooltip).message).toBe('This dataset is used by: vm1, vm2');
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
