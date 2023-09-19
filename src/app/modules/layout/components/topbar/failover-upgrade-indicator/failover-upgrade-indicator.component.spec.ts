import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import {
  FailoverUpgradeIndicatorComponent,
} from 'app/modules/layout/components/topbar/failover-upgrade-indicator/failover-upgrade-indicator.component';
import { selectIsUpgradePending } from 'app/store/ha-info/ha-info.selectors';
import { updatePendingIndicatorPressed } from 'app/store/ha-upgrade/ha-upgrade.actions';

describe('FailoverUpgradeIndicatorComponent', () => {
  let spectator: Spectator<FailoverUpgradeIndicatorComponent>;
  const createComponent = createComponentFactory({
    component: FailoverUpgradeIndicatorComponent,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectIsUpgradePending,
            value: true,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows an indicator when there is a pending failover upgrade', () => {
    expect(spectator.query('button ix-icon')).toBeTruthy();
  });

  it('shows dialog when indicator is pressed', () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    spectator.click('button');

    expect(store$.dispatch).toHaveBeenCalledWith(updatePendingIndicatorPressed());
  });
});
