import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DiskType } from 'app/enums/disk-type.enum';
import { EnclosureDiskComponent } from 'app/pages/system/enclosure/components/disk-component/disk.component';

describe('EnclosureDiskComponent', () => {
  let spectator: Spectator<EnclosureDiskComponent>;

  const createComponent = createComponentFactory({
    component: EnclosureDiskComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        data: {
          name: 'test disk name',
          type: DiskType.Ssd,
        },
      },
    });
  });

  it('shows disk name', () => {
    expect(spectator.query('.disk-ui-name').textContent.trim()).toBe('test disk name');
  });

  it('shows disk type', () => {
    expect(spectator.query('.disk-ui-type').textContent.trim()).toBe('SSD');
  });
});
