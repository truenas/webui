import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatRipple } from '@angular/material/core';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { LetDirective } from 'app/directives/app-let.directive';
import { NavigateAndInteractDirective } from 'app/directives/navigate-and-interact/navigate-and-interact.directive';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import {
  alertPanelClosed,
  dismissAllAlertsPressed,
  reopenAllAlertsPressed,
} from 'app/modules/alerts/store/alert.actions';
import {
  AlertSlice,
  selectAlertState,
  selectDismissedAlerts,
  selectUnreadAlerts,
} from 'app/modules/alerts/store/alert.selectors';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-alerts-panel',
  templateUrl: './alerts-panel.component.html',
  styleUrls: ['./alerts-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    TestDirective,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    NavigateAndInteractDirective,
    MatProgressBar,
    LetDirective,
    AlertComponent,
    MatRipple,
    TranslateModule,
    AsyncPipe,
    RequiresRolesDirective,
  ],
})
export class AlertsPanelComponent implements OnInit {
  readonly requiredRoles = [Role.AlertListWrite];

  error$ = this.store$.select(selectAlertState).pipe(map((state) => state.error));
  isLoading$ = this.store$.select(selectAlertState).pipe(map((state) => state.isLoading));
  unreadAlerts$ = this.store$.select(selectUnreadAlerts);
  dismissedAlerts$ = this.store$.select(selectDismissedAlerts);

  isHaLicensed = false;

  constructor(
    private store$: Store<AlertSlice>,
    private router: Router,
    private systemService: SystemGeneralService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.checkHaStatus();
  }

  onPanelClosed(): void {
    this.store$.dispatch(alertPanelClosed());
  }

  onReopenAll(): void {
    this.store$.dispatch(reopenAllAlertsPressed());
  }

  onDismissAll(): void {
    this.store$.dispatch(dismissAllAlertsPressed());
  }

  navigateTo(route: string[], extras?: NavigationExtras): void {
    this.closePanel();
    this.router.navigate(route, extras);
  }

  closePanel(): void {
    this.store$.dispatch(alertPanelClosed());
  }

  private checkHaStatus(): void {
    if (!this.systemService.isEnterprise) {
      return;
    }

    this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
      this.isHaLicensed = isHaLicensed;
      this.cdr.markForCheck();
    });
  }
}
