import { DialogRef } from '@angular/cdk/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { EventUnion } from '@truenas/api-client';
import { Subject } from 'rxjs';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import {
  ResilverProgressDialog,
} from 'app/modules/layout/topbar/resilvering-indicator/resilver-progress/resilver-progress.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

describe('ResilverProgressDialog', () => {
  let spectator: Spectator<ResilverProgressDialog>;
  const scanEvents$ = new Subject<EventUnion<WebUiApiDirectory, 'pool.scan'>>();

  const createComponent = createComponentFactory({
    component: ResilverProgressDialog,
    providers: [
      mockProvider(DialogRef),
      mockProvider(ApiService, {
        subscribe: jest.fn(() => scanEvents$),
      }),
    ],
  });

  function emitScan(scan: Partial<PoolScan['scan']>): void {
    scanEvents$.next({
      msg: 'changed',
      fields: { name: 'tank', scan },
    } as EventUnion<WebUiApiDirectory, 'pool.scan'>);
    spectator.detectChanges();
  }

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows the pool, progress and state of a running resilver', () => {
    emitScan({ function: PoolScanFunction.Resilver, state: PoolScanState.Scanning, percentage: 42.5 });

    expect(spectator.inject(ApiService).subscribe).toHaveBeenCalledWith('pool.scan');
    expect(spectator.element).toHaveText('Resilvering pool: tank');
    expect(spectator.element).toHaveText('42.50%');
    expect(spectator.element).toHaveText('Status: SCANNING');
  });

  it('ignores scrub updates', () => {
    emitScan({ function: PoolScanFunction.Scrub, state: PoolScanState.Scanning, percentage: 10 });

    expect(spectator.element).not.toHaveText('tank');
  });
});
