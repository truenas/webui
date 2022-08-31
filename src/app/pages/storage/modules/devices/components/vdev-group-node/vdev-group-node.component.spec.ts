import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { VDevGroup } from 'app/interfaces/device-nested-data-node.interface';
import { VDevGroupNodeComponent } from 'app/pages/storage/modules/devices/components/vdev-group-node/vdev-group-node.component';

describe('VDevGroupNodeComponent', () => {
  let spectator: Spectator<VDevGroupNodeComponent>;
  const vdevGroup = {
    group: 'Data VDEVs',
    guid: 'data',
    children: [],
  } as VDevGroup;
  const createComponent = createComponentFactory({
    component: VDevGroupNodeComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { vdevGroup },
    });
  });

  it('shows caption', () => {
    expect(spectator.query('.caption-name')).toHaveText(vdevGroup.group);
  });
});
