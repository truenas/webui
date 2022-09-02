import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { DataProtectionCardComponent } from 'app/pages/datasets/components/data-protection-card/data-protection-card.component';
import {
  DatasetCapacityManagementCardComponent,
} from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import { DatasetDetailsCardComponent } from 'app/pages/datasets/components/dataset-details-card/dataset-details-card.component';
import { DatasetDetailsPanelComponent } from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.component';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';
import { RolesCardComponent } from 'app/pages/datasets/components/roles-card/roles-card.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { ZfsEncryptionCardComponent } from 'app/pages/datasets/modules/encryption/components/zfs-encryption-card/zfs-encryption-card.component';
import { PermissionsCardComponent } from 'app/pages/datasets/modules/permissions/containers/permissions-card/permissions-card.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ModalService } from 'app/services';

describe('DatasetDetailsPanelComponent', () => {
  let spectator: Spectator<DatasetDetailsPanelComponent>;
  let loader: HarnessLoader;
  const fakeModalRef = {
    setParent: jest.fn(),
    setVolId: jest.fn(),
    setTitle: jest.fn(),
    isNew: undefined as boolean,
  };
  const dataset = {
    id: 'root/parent/child',
    pool: 'my-pool',
    name: 'root/parent/child',
    mountpoint: '/mnt/root/parent/child',
    type: DatasetType.Filesystem,
    encrypted: true,
  } as DatasetDetails;
  const datasetDetails = {
    ...dataset,
  } as DatasetDetails;
  const parentDatasetDetails = {
    name: 'root/parent',
  } as DatasetDetails;
  const createComponent = createComponentFactory({
    component: DatasetDetailsPanelComponent,
    declarations: [
      MockComponents(
        DatasetIconComponent,
        DatasetDetailsCardComponent,
        PermissionsCardComponent,
        ZfsEncryptionCardComponent,
        DatasetCapacityManagementCardComponent,
        DataProtectionCardComponent,
        RolesCardComponent,
      ),
    ],
    providers: [
      mockProvider(ModalService, {
        openInSlideIn: jest.fn(() => fakeModalRef),
        onClose$: of(),
      }),
      mockProvider(DatasetTreeStore, {
        selectedDataset$: of(datasetDetails),
        selectedParentDataset$: of(parentDatasetDetails),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        dataset,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a title of current dataset', () => {
    expect(spectator.query('.title .prefix')).toHaveText('Details for');
    expect(spectator.query('.title .mobile-prefix')).toHaveText('Details for');
    expect(spectator.query('.title .full-path')).toHaveText('child');
  });

  it('opens a dataset form when Add Dataset is pressed', async () => {
    const addDatasetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Dataset' }));
    await addDatasetButton.click();
    expect(spectator.inject(ModalService).openInSlideIn).toHaveBeenCalledWith(DatasetFormComponent);
    expect(fakeModalRef.setParent).toHaveBeenCalledWith('root/parent/child');
    expect(fakeModalRef.setVolId).toHaveBeenCalledWith('my-pool');
  });

  it('opens a zvol form when Add Zvol is pressed', async () => {
    const addZvolButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Zvol' }));
    await addZvolButton.click();
    expect(spectator.inject(ModalService).openInSlideIn).toHaveBeenCalledWith(ZvolFormComponent);
    expect(fakeModalRef.setParent).toHaveBeenCalledWith('root/parent/child');
    expect(fakeModalRef.isNew).toBe(true);
  });

  it('shows all the cards', () => {
    const datasetDetailsCard = spectator.query(DatasetDetailsCardComponent);
    expect(datasetDetailsCard).toBeTruthy();
    expect(datasetDetailsCard.dataset).toBe(dataset);

    const dataProtectionCard = spectator.query(DataProtectionCardComponent);
    expect(dataProtectionCard).toBeTruthy();
    expect(dataProtectionCard.dataset).toStrictEqual(datasetDetails);

    const permissionsCard = spectator.query(PermissionsCardComponent);
    expect(permissionsCard).toBeTruthy();
    expect(permissionsCard.dataset).toStrictEqual(datasetDetails);

    const zfsEncryptionCard = spectator.query(ZfsEncryptionCardComponent);
    expect(zfsEncryptionCard).toBeTruthy();
    expect(zfsEncryptionCard.dataset).toStrictEqual(datasetDetails);

    const datasetCapacityManagementCard = spectator.query(DatasetCapacityManagementCardComponent);
    expect(datasetCapacityManagementCard).toBeTruthy();
    expect(datasetCapacityManagementCard.dataset).toStrictEqual(datasetDetails);
  });

  it('hides "Permissions Card" if dataset type is Volume', () => {
    spectator.setInput('dataset', {
      ...dataset,
      type: DatasetType.Volume,
    });
    expect(spectator.query('ix-permissions-card')).not.toBeVisible();
  });
});
