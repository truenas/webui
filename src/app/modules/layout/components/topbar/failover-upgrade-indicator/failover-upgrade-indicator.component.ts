import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectIsUpgradePending } from 'app/store/ha-info/ha-info.selectors';
import { updatePendingIndicatorPressed } from 'app/store/ha-upgrade/ha-upgrade.actions';

@Component({
  selector: 'ix-failover-upgrade-indicator',
  templateUrl: './failover-upgrade-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FailoverUpgradeIndicatorComponent {
  isPendingUpgrade$ = this.store$.select(selectIsUpgradePending);

  constructor(
    private store$: Store,
  ) {}

  showUpgradePendingDialog(): void {
    this.store$.dispatch(updatePendingIndicatorPressed());
  }
}
