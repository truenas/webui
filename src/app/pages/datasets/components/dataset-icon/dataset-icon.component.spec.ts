import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';

describe('DatasetIconComponent', () => {
  let spectator: Spectator<DatasetIconComponent>;
  let ixIcon: IxIconHarness;
  const createComponent = createComponentFactory({
    component: DatasetIconComponent,
  });

  async function setupTest(dataset: DatasetDetails): Promise<void> {
    spectator = createComponent({
      props: {
        dataset,
      },
    });

    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ixIcon = await loader.getHarness(IxIconHarness);
  }

  it('shows an icon for a root dataset', async () => {
    await setupTest({
      name: 'root',
    } as DatasetDetails);

    expect(await ixIcon.getName()).toBe('ix-dataset-root');
  });

  it('shows an icon for an ordinary datasets', async () => {
    await setupTest({
      name: '/root/child',
      type: DatasetType.Filesystem,
    } as DatasetDetails);

    expect(await ixIcon.getName()).toBe('ix-dataset');
  });

  it('shows an icon for a zvol', async () => {
    await setupTest({
      name: '/root/child',
      type: DatasetType.Volume,
    } as DatasetDetails);

    expect(await ixIcon.getName()).toBe('mdi-database');
  });
});
