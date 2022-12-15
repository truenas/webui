import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';
import {
  DatasetEncryptionCellComponent,
} from 'app/pages/datasets/components/dataset-node/dataset-encryption-cell/dataset-encryption-cell.component';
import { DatasetNodeComponent } from 'app/pages/datasets/components/dataset-node/dataset-node.component';
import { datasetToken, isSystemDatasetToken } from 'app/pages/datasets/components/dataset-node/dataset-node.tokens';
import { DatasetRolesCellComponent } from 'app/pages/datasets/components/dataset-node/dataset-roles-cell/dataset-roles-cell.component';

describe('DatasetNodeComponent', () => {
  let spectator: Spectator<DatasetNodeComponent>;
  const dataset = {
    id: 'root/dataset/child',
    name: 'root/dataset/child',
    type: DatasetType.Filesystem,
    available: {
      parsed: 1222333,
    },
    used: {
      parsed: 12344848,
    },
    locked: false,
  } as DatasetDetails;
  const createComponent = createComponentFactory({
    component: DatasetNodeComponent,
    declarations: [
      DatasetIconComponent,
      DatasetEncryptionCellComponent,
      DatasetRolesCellComponent,
    ],
    providers: [
      { provide: datasetToken, useValue: dataset },
      { provide: isSystemDatasetToken, useValue: false },
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { dataset },
    });
  });

  it('shows an icon for current dataset', () => {
    const icon = spectator.query(DatasetIconComponent);
    expect(icon).toBeTruthy();
    expect(icon.dataset).toBe(dataset);
  });

  it('shows dataset name', () => {
    expect(spectator.query('.name')).toHaveText('child');
  });

  it('shows a dataset encryption cell', () => {
    const cell = spectator.query(DatasetEncryptionCellComponent);
    expect(cell).toBeTruthy();
    expect(cell.dataset).toBe(dataset);
  });

  it('shows a dataset roles cell', () => {
    spectator.setInput('dataset', {
      ...dataset,
      name: 'root',
    });

    const cell = spectator.query(DatasetRolesCellComponent);
    expect(cell).toBeTruthy();
    expect(cell.isRoot).toBeTruthy();
    expect(cell.isSystemDataset).toBeFalsy();
  });
});
