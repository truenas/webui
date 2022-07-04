import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import {
  DatasetCapacityManagementCardComponent,
} from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import { DatasetDetailsCardComponent } from 'app/pages/datasets/components/dataset-details-card/dataset-details-card.component';
import { DatasetDetailsPanelComponent } from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.component';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';
import { ZfsEncryptionCardComponent } from 'app/pages/datasets/modules/encryption/components/zfs-encryption-card/zfs-encryption-card.component';
import { PermissionsCardComponent } from 'app/pages/datasets/modules/permissions/containers/permissions-card/permissions-card.component';

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
    type: DatasetType.Filesystem,
  } as Dataset;
  const parentDataset = {
    name: 'root/parent',
  } as Dataset;
  const createComponent = createComponentFactory({
    component: DatasetDetailsPanelComponent,
    declarations: [
      MockComponents(
        DatasetIconComponent,
        DatasetDetailsCardComponent,
        PermissionsCardComponent,
        ZfsEncryptionCardComponent,
        DatasetCapacityManagementCardComponent,
      ),
    ],
    providers: [
      mockProvider(ModalService, {
        openInSlideIn: jest.fn(() => fakeModalRef),
        onClose$: of(),
      }),
      mockProvider(DatasetStore),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        dataset,
        parentDataset,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a title of current dataset', () => {
    expect(spectator.query('.title')).toHaveText('Details for  /root/dataset/ child');
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

    const permissionsCard = spectator.query(PermissionsCardComponent);
    expect(permissionsCard).toBeTruthy();
    expect(permissionsCard.dataset).toBe(dataset);

    const zfsEncryptionCard = spectator.query(ZfsEncryptionCardComponent);
    expect(zfsEncryptionCard).toBeTruthy();
    expect(zfsEncryptionCard.dataset).toBe(dataset);

    const datasetCapacityManagementCard = spectator.query(DatasetCapacityManagementCardComponent);
    expect(datasetCapacityManagementCard).toBeTruthy();
    expect(datasetCapacityManagementCard.dataset).toBe(dataset);
  });

  it('hides "Permissions Card" if dataset type is Volume', () => {
    spectator.setInput('dataset', {
      ...dataset,
      type: DatasetType.Volume,
    });
    expect(spectator.query('ix-permissions-card')).not.toBeVisible();
  });
});
