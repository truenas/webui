import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  StatusesLegendComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/status-view/statuses-legend/statuses-legend.component';

describe('StatusesLegendComponent', () => {
  let spectator: Spectator<StatusesLegendComponent>;
  const createComponent = createComponentFactory({
    component: StatusesLegendComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        slots: [
          { pool_info: { disk_status: EnclosureDiskStatus.Online } },
          { pool_info: { disk_status: EnclosureDiskStatus.Degraded } },
          { pool_info: { disk_status: EnclosureDiskStatus.Faulted } },
          { },
        ] as DashboardEnclosureSlot[],
      },
    });
  });

  it('shows statuses of disks that are present in the enclosure', () => {
    const lines = spectator.queryAll('.line');

    expect(lines).toHaveLength(3);
    expect(lines[0]).toHaveText('Online');
    expect(lines[1]).toHaveText('Degraded');
    expect(lines[2]).toHaveText('Faulted');

    // CSS variables aren't rendered in JSDOM
  });
});
