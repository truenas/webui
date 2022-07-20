import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DatasetRoot } from 'app/interfaces/dataset-nested-data-node.interface';
import { DatasetGroupNodeComponent } from 'app/pages/datasets/components/dataset-group-node/dataset-group-node.component';

describe('DatasetGroupNodeComponent', () => {
  let spectator: Spectator<DatasetGroupNodeComponent>;
  const dataset = {
    id: '_pool_id',
    children: [],
    pool: 'test pool',
    name: 'test pool',
  } as DatasetRoot;
  const createComponent = createComponentFactory({
    component: DatasetGroupNodeComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { dataset },
    });
  });

  it('shows caption', () => {
    expect(spectator.query('.caption-name')).toHaveText('Pool:');
    expect(spectator.query('.caption-name')).toHaveText(dataset.name);
  });
});
