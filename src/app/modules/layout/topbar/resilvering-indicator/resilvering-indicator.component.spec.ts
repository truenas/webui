import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnDialog, TnIconButtonHarness } from '@truenas/ui-components';
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
  let loader: HarnessLoader;
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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows resilvering icon when there is an unfinished scan of Resilver type', async () => {
    const button = await loader.getHarness(TnIconButtonHarness);

    expect(await button.getName()).toBe('autorenew');
    expect(spectator.query('tn-icon.spin')).toBeTruthy();
  });

  it('opens resilver progress dialog when icon is pressed', async () => {
    const button = await loader.getHarness(TnIconButtonHarness);
    await button.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ResilverProgressDialog);
  });
});
