import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  DatasetEncryptionCellComponent,
} from 'app/pages/datasets/components/dataset-node/dataset-encryption-cell/dataset-encryption-cell.component';

describe('DatasetEncryptionCellComponent', () => {
  let spectator: Spectator<DatasetEncryptionCellComponent>;
  const createComponent = createComponentFactory({
    component: DatasetEncryptionCellComponent,
    declarations: [
      MockComponent(IxIconComponent),
    ],
  });

  it('shows "Unencrypted" when dataset is not encrypted', () => {
    spectator = createComponent({
      props: {
        dataset: {
          encrypted: false,
        } as DatasetDetails,
      },
    });

    expect(spectator.query('.encryption-description')).toHaveText('Unencrypted');
  });

  it('shows "Unlocked" and an icon when dataset is unlocked', () => {
    spectator = createComponent({
      props: {
        dataset: {
          encrypted: true,
          locked: false,
          name: 'root/dataset',
          id: 'root/dataset',
          encryption_root: 'root/dataset',
        } as DatasetDetails,
      },
    });

    expect(spectator.query('.encryption-description')).toHaveText('Unlocked');
    expect(spectator.query(IxIconComponent)!.name).toBe('mdi-lock-open-variant');
  });

  it('shows "Unlocked by ancestor" and an icon when ancestor dataset is unlocked and encryption is inherited', () => {
    spectator = createComponent({
      props: {
        dataset: {
          encrypted: true,
          locked: false,
          name: 'root/dataset',
          id: 'root/dataset',
          encryption_root: 'root',
        } as DatasetDetails,
      },
    });

    expect(spectator.query('.encryption-description')).toHaveText('Unlocked');
    expect(spectator.query('.encryption-description')).toHaveText('by ancestor');
    expect(spectator.query(IxIconComponent)!.name).toBe('mdi-lock-open-variant-outline');
  });

  it('shows "Locked" and an icon when dataset is locked', () => {
    spectator = createComponent({
      props: {
        dataset: {
          encrypted: true,
          locked: true,
          name: 'root/dataset',
          id: 'root/dataset',
          encryption_root: 'root/dataset',
        } as DatasetDetails,
      },
    });

    expect(spectator.query('.encryption-description')).toHaveText('Locked');
    expect(spectator.query(IxIconComponent)!.name).toBe('mdi-lock');
  });

  it('shows "Locked by ancestor" and an icon when ancestor dataset is locked and encryption is inherited', () => {
    spectator = createComponent({
      props: {
        dataset: {
          encrypted: true,
          locked: true,
          name: 'root/dataset',
          id: 'root/dataset',
          encryption_root: 'root',
        } as DatasetDetails,
      },
    });

    expect(spectator.query('.encryption-description')).toHaveText('Locked');
    expect(spectator.query('.encryption-description')).toHaveText('by ancestor');
    expect(spectator.query(IxIconComponent)!.name).toBe('mdi-lock-outline');
  });
});
