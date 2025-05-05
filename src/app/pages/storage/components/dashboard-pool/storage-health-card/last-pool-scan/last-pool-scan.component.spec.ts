import { byText, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScanUpdate } from 'app/interfaces/pool.interface';
import {
  LastPoolScanComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/last-pool-scan/last-pool-scan.component';

describe('LastPoolScanComponent', () => {
  let spectator: Spectator<LastPoolScanComponent>;
  const createComponent = createComponentFactory({
    component: LastPoolScanComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        scan: {
          state: PoolScanState.Finished,
          function: PoolScanFunction.Scrub,
          start_time: { $date: 1655917081000 },
          end_time: { $date: 1655917125000 },
          errors: 1,
        } as PoolScanUpdate,
      },
    });
  });

  it('shows information about last scan', () => {
    const lastScan = spectator.query(byText('Last Scan:'))!.parentElement!;
    expect(lastScan.querySelector('.value')).toHaveText('Finished Scrub on 2022-06-22 19:58:45');

    const lastScanErrors = spectator.query(byText('Last Scan Errors:'))!.parentElement!;
    expect(lastScanErrors.querySelector('.value')).toHaveText('1');

    const lastScanDuration = spectator.query(byText('Last Scan Duration:'))!.parentElement!;
    expect(lastScanDuration.querySelector('.value')).toHaveText('44 seconds');
  });
});
