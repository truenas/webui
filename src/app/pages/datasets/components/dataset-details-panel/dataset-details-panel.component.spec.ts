import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import {
  DatasetCapacityManagementCardComponent,
} from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import {
  DatasetDetailsCardComponent,
} from 'app/pages/datasets/components/dataset-details-card/dataset-details-card.component';
import {
  DatasetDetailsPanelComponent,
} from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.component';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import {
  ZfsEncryptionCardComponent,
} from 'app/pages/datasets/modules/encryption/components/zfs-encryption-card/zfs-encryption-card.component';
import {
  PermissionsCardComponent,
} from 'app/pages/datasets/modules/permissions/containers/permissions-card/permissions-card.component';
import { DatasetStore } from 'app/pages/datasets/store/dataset-store.service';
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
    type: DatasetType.Filesystem,
  } as Dataset;
  const parentDataset = {
    name: 'root/parent',
  } as Dataset;
  const createComponent = createComponentFactory({
    component: DatasetDetailsPanelComponent,
    declarations: [
      MockComponent(DatasetIconComponent),
      MockComponent(DatasetDetailsCardComponent),
      MockComponent(PermissionsCardComponent),
      MockComponent(ZfsEncryptionCardComponent),
      MockComponent(DatasetCapacityManagementCardComponent),
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

  it('shows dataset path and name in the header', () => {
    const title = spectator.query('.title');
    expect(title).toHaveText('Details for');
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

  it('shows a details card for the dataset', () => {
    const card = spectator.query(DatasetDetailsCardComponent);
    expect(card).toExist();
    expect(card.dataset).toEqual(dataset);
  });

  it('shows a permissions card for the dataset', () => {
    const card = spectator.query(PermissionsCardComponent);
    expect(card).toExist();
    expect(card.dataset).toEqual(dataset);
  });

  it('shows a ZFS encryption card for the dataset', () => {
    const card = spectator.query(ZfsEncryptionCardComponent);
    expect(card).toExist();
    expect(card.dataset).toEqual(dataset);
    expect(card.parentDataset).toEqual(parentDataset);
  });

  it('shows a capacity management card for the dataset', () => {
    const card = spectator.query(DatasetCapacityManagementCardComponent);
    expect(card).toExist();
    expect(card.dataset).toEqual(dataset);
  });
});
