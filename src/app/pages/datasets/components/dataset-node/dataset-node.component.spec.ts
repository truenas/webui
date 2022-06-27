import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';
import {
  DatasetEncryptionCellComponent,
} from 'app/pages/datasets/components/dataset-node/dataset-encryption-cell/dataset-encryption-cell.component';
import { DatasetNodeComponent } from 'app/pages/datasets/components/dataset-node/dataset-node.component';

describe('DatasetNodeComponent', () => {
  let spectator: Spectator<DatasetNodeComponent>;
  const dataset = {
    name: 'root/dataset/child',
    type: DatasetType.Filesystem,
    available: {
      parsed: 1222333,
    },
    used: {
      parsed: 12344848,
    },
  } as Dataset;
  const createComponent = createComponentFactory({
    component: DatasetNodeComponent,
    declarations: [
      DatasetIconComponent,
      DatasetEncryptionCellComponent,
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

  describe('roles', () => {
    it('says "Root Dataset" for a root dataset', () => {
      spectator.setInput('dataset', {
        ...dataset,
        name: 'root',
      });
      expect(spectator.query('.cell-roles')).toHaveText('Root Dataset');
    });
  });
});
