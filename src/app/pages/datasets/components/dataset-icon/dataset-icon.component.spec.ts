import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatIconHarness } from '@angular/material/icon/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';

describe('DatasetIconComponent', () => {
  let spectator: Spectator<DatasetIconComponent>;
  let matIcon: MatIconHarness;
  const createComponent = createComponentFactory({
    component: DatasetIconComponent,
  });

  async function setupTest(dataset: Dataset): Promise<void> {
    spectator = createComponent({
      props: {
        dataset,
      },
    });

    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    matIcon = await loader.getHarness(MatIconHarness);
  }

  it('shows an icon for a root dataset', async () => {
    await setupTest({
      name: 'root',
    } as Dataset);

    expect(await matIcon.getName()).toBe('dataset');
  });

  it('shows an icon for an ordinary datasets', async () => {
    await setupTest({
      name: '/root/child',
      type: DatasetType.Filesystem,
    } as Dataset);

    expect(await matIcon.getName()).toBe('folder');
  });

  it('shows an icon for a zvol', async () => {
    await setupTest({
      name: '/root/child',
      type: DatasetType.Volume,
    } as Dataset);

    expect(await matIcon.getName()).toBe('mdi-database');
  });
});
