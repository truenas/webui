import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatRipple } from '@angular/material/core';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { NavigateAndHighlightDirective } from 'app/directives/navigate-and-interact/navigate-and-highlight.directive';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import {
  alertPanelClosed,
  dismissAllAlertsPressed,
  reopenAllAlertsPressed,
} from 'app/modules/alerts/store/alert.actions';
import {
  selectAlertState,
  selectDismissedAlerts,
  selectUnreadAlerts,
} from 'app/modules/alerts/store/alert.selectors';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-alerts-panel',
  templateUrl: './alerts-panel.component.html',
  styleUrls: ['./alerts-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    TestDirective,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    NavigateAndHighlightDirective,
    MatProgressBar,
    AlertComponent,
    MatRipple,
    TranslateModule,
    AsyncPipe,
    RequiresRolesDirective,
  ],
})
export class AlertsPanelComponent implements OnInit {
  private store$ = inject<Store<AppState>>(Store);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  protected readonly requiredRoles = [Role.AlertListWrite];

  error$ = this.store$.select(selectAlertState).pipe(map((state) => state.error));
  isLoading$ = this.store$.select(selectAlertState).pipe(map((state) => state.isLoading));
  unreadAlerts$ = this.store$.select(selectUnreadAlerts);
  dismissedAlerts$ = this.store$.select(selectDismissedAlerts);

  private readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = false;

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
    if (!this.isEnterprise()) {
      return;
    }

    this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
      this.isHaLicensed = isHaLicensed;
      this.cdr.markForCheck();
    });
  }
}
