import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
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
        } as DatasetDetails,
      },
    });

    expect(spectator.query('.encryption-description')).toHaveText('Unencrypted');
  });

  it('shows "Unlocked" and an icon when dataset is unlocked', async () => {
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
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('lock-open-variant');
  });

  it('shows "Unlocked by parent" and an icon when ancestor dataset is unlocked and encryption is inherited', async () => {
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
    expect(spectator.query('.encryption-description')).toHaveText('by parent');
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('lock-open-variant-outline');
  });

  it('shows "Locked" and an icon when dataset is locked', async () => {
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
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('lock');
  });

  it('shows "Locked by parent" and an icon when ancestor dataset is locked and encryption is inherited', async () => {
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
    expect(spectator.query('.encryption-description')).toHaveText('by parent');
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('lock-outline');
  });
});
