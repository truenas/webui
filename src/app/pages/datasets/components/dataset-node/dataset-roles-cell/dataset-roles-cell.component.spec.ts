import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTooltip } from '@angular/material/tooltip';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { DatasetRolesCellComponent } from 'app/pages/datasets/components/dataset-node/dataset-roles-cell/dataset-roles-cell.component';

describe('DatasetRolesCellComponent', () => {
  let spectator: Spectator<DatasetRolesCellComponent>;
  let ixIcon: IxIconHarness;

  const createComponent = createComponentFactory({
    component: DatasetRolesCellComponent,
  });

  async function setupTest(dataset: DatasetDetails, isSystemDataset = false): Promise<void> {
    spectator = createComponent({
      props: {
        dataset,
        isSystemDataset,
      },
    });

    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ixIcon = await loader.getHarness(IxIconHarness);
  }

  it('shows "System Dataset" when dataset is marked as system', async () => {
    await setupTest({ name: 'root/dataset' } as DatasetDetails, true);

    expect(await ixIcon.getName()).toBe('ix-truenas-logo-mark');
    expect(spectator.query(MatTooltip)!.message).toBe('This dataset is used by the system');
  });

  it('shows "Applications" icon and tooltip when dataset has name `ix-apps`', async () => {
    await setupTest({ name: 'root/ix-apps' } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('apps');
    expect(spectator.query(MatTooltip)!.message).toBe(
      'This dataset is used to store apps config and other container related data',
    );
  });

  it('shows "Applications" icon and tooltip when dataset has apps', async () => {
    await setupTest({ name: 'root', apps: [{ name: 'app1', path: '' }, { name: 'app1', path: '' }, { name: 'app2', path: '' }] } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('apps');
    expect(spectator.query(MatTooltip)!.message).toBe('This dataset is used by: app1, app2');
  });

  it('shows "VM" icon and tooltip when dataset has vms', async () => {
    await setupTest({ name: 'root', vms: [{ name: 'vm1', path: '' }, { name: 'vm1', path: '' }, { name: 'vm2', path: '' }] } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('mdi-laptop');
    expect(spectator.query(MatTooltip)!.message).toBe('This dataset is used by: vm1, vm2');
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

    expect(await ixIcon.getName()).toBe('mdi-laptop');
  });

  it('shows "SMB Share" icon for dataset', async () => {
    await setupTest({
      name: 'root/smb-share',
      smb_shares: [{}],
    } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('ix-smb-share');
  });

  it('shows "NFS Share" icon for dataset', async () => {
    await setupTest({
      name: 'root/nfs-share',
      nfs_shares: [{}],
    } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('ix-nfs-share');
  });

  it('shows "iSCSI Share" icon for dataset', async () => {
    await setupTest({
      name: 'root/iscsi-shares',
      iscsi_shares: [{}],
    } as DatasetDetails, false);

    expect(await ixIcon.getName()).toBe('ix-iscsi-share');
  });
});
