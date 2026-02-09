import { Signal } from '@angular/core';
import { byText, Spectator } from '@ngneat/spectator/jest';
import { Alert } from 'app/interfaces/alert.interface';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';

export class AlertsPanelPageObject {
  constructor(private spectator: Spectator<AlertsPanelComponent>) {}

  private getAllAlertComponents(): AlertComponent[] {
    // Use spectator's queryAll with directive to get all AlertComponent instances
    return this.spectator.queryAll(AlertComponent);
  }

  private getAlertData(alertComponent: AlertComponent): Alert & { duplicateCount?: number } | undefined {
    // Handle both signal (function) and mock (property)
    // In real component: alert is a Signal
    // In MockComponent: alert is a plain property
    const alertProp = alertComponent.alert as
      | Signal<Alert & { duplicateCount?: number }>
      | Alert & { duplicateCount?: number };
    if (typeof alertProp === 'function') {
      return alertProp();
    }
    return alertProp;
  }

  get unreadAlertComponents(): AlertComponent[] {
    // Get all alert components and filter by dismissed status
    const allAlerts = this.getAllAlertComponents();
    return allAlerts.filter((alertComponent) => {
      const alert = this.getAlertData(alertComponent);
      return alert && !alert.dismissed;
    });
  }

  get dismissedAlertComponents(): AlertComponent[] {
    // Get all alert components and filter by dismissed status
    const allAlerts = this.getAllAlertComponents();
    return allAlerts.filter((alertComponent) => {
      const alert = this.getAlertData(alertComponent);
      return alert && alert.dismissed;
    });
  }

  get dismissAllButton(): HTMLElement | null {
    return this.spectator.query(byText('Dismiss All Alerts'));
  }

  get reopenAllButton(): HTMLElement | null {
    return this.spectator.query(byText('Re-Open All Alerts'));
  }

  get unreadAlertsSection(): HTMLElement | null {
    // Check if there are any category sections with unread alerts
    return this.unreadAlertComponents.length > 0 ? this.spectator.element : null;
  }

  get dismissedAlertsSection(): HTMLElement | null {
    // Check if there are any dismissed alerts
    return this.dismissedAlertComponents.length > 0 ? this.spectator.element : null;
  }
}
