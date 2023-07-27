import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction,
} from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { Alert } from 'app/interfaces/alert.interface';
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
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-alerts-panel',
  templateUrl: './alerts-panel.component.html',
  styleUrls: ['./alerts-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsPanelComponent implements OnInit {
  error$ = this.store$.select(selectAlertState).pipe(map((state) => state.error));
  isLoading$ = this.store$.select(selectAlertState).pipe(map((state) => state.isLoading));
  unreadAlerts$ = this.store$.select(selectUnreadAlerts);
  dismissedAlerts$ = this.store$.select(selectDismissedAlerts);

  isHaLicensed = false;

  readonly trackByAlertId: TrackByFunction<Alert> = (_, alert) => alert.id;

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
    this.store$.dispatch(alertPanelClosed());
    this.router.navigate(route, extras);
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
