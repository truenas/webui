import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { poolScanFromEvent, PoolScanEvent } from 'app/helpers/pool-scan-event.helper';
import { PoolScan } from 'app/interfaces/resilver-job.interface';

describe('poolScanFromEvent', () => {
  it('returns the scan a change carries under fields', () => {
    const scan = {
      name: 'tank',
      scan: { function: PoolScanFunction.Resilver, state: PoolScanState.Scanning },
    } as PoolScan;

    expect(poolScanFromEvent({ msg: 'changed', fields: scan } as unknown as PoolScanEvent)).toEqual(scan);
  });

  it('returns null for anything but a change', () => {
    expect(poolScanFromEvent({ msg: 'removed' } as PoolScanEvent)).toBeNull();
  });
});
