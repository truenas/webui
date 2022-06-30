import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { Dataset } from 'app/interfaces/dataset.interface';
import {
  DatasetEncryptionCellComponent,
} from 'app/pages/datasets/components/dataset-node/dataset-encryption-cell/dataset-encryption-cell.component';

describe('DatasetEncryptionCellComponent', () => {
  let spectator: Spectator<DatasetEncryptionCellComponent>;
  const createComponent = createComponentFactory({
    component: DatasetEncryptionCellComponent,
  });

  it('shows "Unencrypted" when dataset is not encrypted', () => {
    spectator = createComponent({
      props: {
        dataset: {
          encrypted: false,
        } as Dataset,
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
          encryption_root: 'root/dataset',
        } as Dataset,
      },
    });

    expect(spectator.query('.encryption-description')).toHaveText('Unlocked');
    expect(spectator.query('mat-icon')).toHaveText('lock_open');
  });

  it('shows "Unlocked by ancestor" and an icon when ancestor dataset is unlocked and encryption is inherited', () => {
    spectator = createComponent({
      props: {
        dataset: {
          encrypted: true,
          locked: false,
          name: 'root/dataset',
          encryption_root: 'root',
        } as Dataset,
      },
    });

    expect(spectator.query('.encryption-description')).toHaveText('Unlocked');
    expect(spectator.query('.encryption-description')).toHaveText('by ancestor');
    expect(spectator.query('mat-icon')).toHaveText('lock_open'); // TODO: Different icon
  });

  it('shows "Locked" and an icon when dataset is locked', () => {
    spectator = createComponent({
      props: {
        dataset: {
          encrypted: true,
          locked: true,
          name: 'root/dataset',
          encryption_root: 'root/dataset',
        } as Dataset,
      },
    });

    expect(spectator.query('.encryption-description')).toHaveText('Locked');
    expect(spectator.query('mat-icon')).toHaveText('lock_outline');
  });

  it('shows "Locked by ancestor" and an icon when ancestor dataset is locked and encryption is inherited', () => {
    spectator = createComponent({
      props: {
        dataset: {
          encrypted: true,
          locked: true,
          name: 'root/dataset',
          encryption_root: 'root/dataset',
        } as Dataset,
      },
    });

    expect(spectator.query('.encryption-description')).toHaveText('Locked');
    expect(spectator.query('.encryption-description')).toHaveText('by ancestor');
    expect(spectator.query('mat-icon')).toHaveText('lock');
  });
});
