import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { Role } from 'app/enums/role.enum';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { selectIsUpgradePending } from 'app/store/ha-info/ha-info.selectors';
import { updatePendingIndicatorPressed } from 'app/store/ha-upgrade/ha-upgrade.actions';

@Component({
  selector: 'ix-failover-upgrade-indicator',
  templateUrl: './failover-upgrade-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonDirectivesModule,
    MatIconButton,
    TestIdModule,
    MatTooltip,
    IxIconModule,
    AsyncPipe,
    TranslateModule,
  ],
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
