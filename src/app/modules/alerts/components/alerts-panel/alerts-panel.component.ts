import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core';
import { Router } from '@angular/router';
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

@Component({
  selector: 'ix-alerts-panel',
  templateUrl: './alerts-panel.component.html',
  styleUrls: ['./alerts-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsPanelComponent {
  error$ = this.store$.select(selectAlertState).pipe(map((state) => state.error));
  isLoading$ = this.store$.select(selectAlertState).pipe(map((state) => state.isLoading));
  unreadAlerts$ = this.store$.select(selectUnreadAlerts);
  dismissedAlerts$ = this.store$.select(selectDismissedAlerts);

  readonly trackByAlertId: TrackByFunction<Alert> = (_, alert) => alert.id;

  constructor(
    private store$: Store<AlertSlice>,
    private router: Router,
  ) {}

  onPanelClosed(): void {
    this.store$.dispatch(alertPanelClosed());
  }

  onReopenAll(): void {
    this.store$.dispatch(reopenAllAlertsPressed());
  }

  onDismissAll(): void {
    this.store$.dispatch(dismissAllAlertsPressed());
  }

  navigateTo(route: string[]): void {
    this.store$.dispatch(alertPanelClosed());
    this.router.navigate(route);
  }
}
