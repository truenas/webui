import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Role } from 'app/enums/role.enum';
import { selectIsUpgradePending } from 'app/store/ha-info/ha-info.selectors';
import { updatePendingIndicatorPressed } from 'app/store/ha-upgrade/ha-upgrade.actions';

@Component({
  selector: 'ix-failover-upgrade-indicator',
  templateUrl: './failover-upgrade-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FailoverUpgradeIndicatorComponent {
  readonly requiredRoles = [Role.FailoverWrite];

  isPendingUpgrade$ = this.store$.select(selectIsUpgradePending);

  constructor(
    private store$: Store,
  ) {}

  showUpgradePendingDialog(): void {
    this.store$.dispatch(updatePendingIndicatorPressed());
  }
}
