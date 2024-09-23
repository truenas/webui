import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { selectIsUpgradePending } from 'app/store/ha-info/ha-info.selectors';
import { updatePendingIndicatorPressed } from 'app/store/ha-upgrade/ha-upgrade.actions';

@Component({
  selector: 'ix-failover-upgrade-indicator',
  templateUrl: './failover-upgrade-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    TestIdModule,
    MatTooltip,
    IxIconComponent,
    AsyncPipe,
    TranslateModule,
    RequiresRolesDirective,
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
