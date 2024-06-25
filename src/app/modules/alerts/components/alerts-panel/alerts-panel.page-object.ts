import { byText, Spectator } from '@ngneat/spectator/jest';
import { queryAllNestedDirectives } from 'app/core/testing/utils/query-all-nested-directives.utils';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';

export class AlertsPanelPageObject {
  constructor(private spectator: Spectator<AlertsPanelComponent>) {}

  get unreadAlertComponents(): AlertComponent[] {
    return queryAllNestedDirectives(this.spectator.debugElement, this.unreadAlertsSection, AlertComponent);
  }

  get dismissedAlertComponents(): AlertComponent[] {
    return queryAllNestedDirectives(this.spectator.debugElement, this.dismissedAlertsSection, AlertComponent);
  }

  get dismissAllButton(): HTMLElement {
    return this.spectator.query(byText('Dismiss All Alerts'));
  }

  get reopenAllButton(): HTMLElement {
    return this.spectator.query(byText('Re-Open All Alerts'));
  }

  get unreadAlertsSection(): HTMLElement {
    return this.spectator.query('.unread-alerts');
  }

  get dismissedAlertsSection(): HTMLElement {
    return this.spectator.query('.dismissed-alerts');
  }
}
