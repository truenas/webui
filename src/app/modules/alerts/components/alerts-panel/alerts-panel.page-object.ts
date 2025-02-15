import { byText, Spectator } from '@ngneat/spectator/jest';
import { queryAllNestedDirectives } from 'app/core/testing/utils/query-all-nested-directives.utils';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';

export class AlertsPanelPageObject {
  constructor(private spectator: Spectator<AlertsPanelComponent>) {}

  get unreadAlertComponents(): AlertComponent[] {
    if (!this.unreadAlertsSection) {
      throw new Error('Unread alerts section not found');
    }
    return queryAllNestedDirectives(this.spectator.debugElement, this.unreadAlertsSection, AlertComponent);
  }

  get dismissedAlertComponents(): AlertComponent[] {
    if (!this.dismissedAlertsSection) {
      throw new Error('Dismissed alerts section not found');
    }
    return queryAllNestedDirectives(this.spectator.debugElement, this.dismissedAlertsSection, AlertComponent);
  }

  get dismissAllButton(): HTMLElement | null {
    return this.spectator.query(byText('Dismiss All Alerts'));
  }

  get reopenAllButton(): HTMLElement | null {
    return this.spectator.query(byText('Re-Open All Alerts'));
  }

  get unreadAlertsSection(): HTMLElement | null {
    return this.spectator.query('.unread-alerts');
  }

  get dismissedAlertsSection(): HTMLElement | null {
    return this.spectator.query('.dismissed-alerts');
  }
}
