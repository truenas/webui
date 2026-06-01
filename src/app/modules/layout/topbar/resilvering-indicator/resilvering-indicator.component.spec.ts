import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnDialog } from '@truenas/ui-components';
import { of } from 'rxjs';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScanUpdate } from 'app/interfaces/pool.interface';
import {
  ResilverProgressDialog,
} from 'app/modules/layout/topbar/resilvering-indicator/resilver-progress/resilver-progress.component';
import {
  ResilveringIndicatorComponent,
} from 'app/modules/layout/topbar/resilvering-indicator/resilvering-indicator.component';
import { ApiService } from 'app/modules/websocket/api.service';

describe('ResilveringIndicatorComponent', () => {
  let spectator: Spectator<ResilveringIndicatorComponent>;
  const createComponent = createComponentFactory({
    component: ResilveringIndicatorComponent,
    providers: [
      mockProvider(TnDialog),
      mockProvider(ApiService, {
        subscribe: jest.fn().mockReturnValue(of({
          fields: {
            scan: {
              function: PoolScanFunction.Resilver,
              state: PoolScanState.Scanning,
            } as PoolScanUpdate,
          },
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows resilvering icon when there is an unfinished scan of Resilver type', () => {
    expect(spectator.query('button tn-icon.spin')).toBeTruthy();
  });

  it('opens resilver progress dialog when icon is pressed', () => {
    spectator.click('button');

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ResilverProgressDialog);
  });
});
