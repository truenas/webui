import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert, SmartAlertAction, SmartAlertActionType } from 'app/interfaces/smart-alert.interface';
import { getAlertEnhancement } from './alert-enhancement.registry';

@Injectable({
  providedIn: 'root',
})
export class SmartAlertService {
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private window = this.document.defaultView as Window;

  /**
   * Enhances a basic alert with smart actions, contextual help, and metadata
   */
  enhanceAlert(alert: Alert): Alert & EnhancedAlert {
    const enhancement = getAlertEnhancement(alert.source, alert.klass);

    if (!enhancement) {
      return alert as Alert & EnhancedAlert;
    }

    // Bind handlers to actions
    const boundActions = enhancement.actions?.map((action) => ({
      ...action,
      handler: this.createActionHandler(action),
    }));

    return {
      ...alert,
      category: enhancement.category,
      actions: boundActions,
      contextualHelp: enhancement.contextualHelp,
      detailedHelp: enhancement.detailedHelp,
      documentationUrl: enhancement.documentationUrl,
      relatedMenuPath: enhancement.relatedMenuPath,
      customIcon: enhancement.customIcon,
      severityScore: enhancement.severityScore,
    };
  }

  /**
   * Creates a handler function for an action based on its type
   */
  private createActionHandler(action: SmartAlertAction): () => void {
    return () => {
      switch (action.type) {
        case SmartAlertActionType.Navigate:
          if (action.route) {
            this.router.navigate(action.route, {
              fragment: action.fragment,
              queryParams: action.queryParams,
            });
          }
          break;

        case SmartAlertActionType.ExternalLink:
          if (action.externalUrl) {
            this.window.open(action.externalUrl, '_blank', 'noopener,noreferrer');
          }
          break;

        case SmartAlertActionType.ApiCall:
          // TODO: Implement API call handler when backend supports it
          console.warn('API call actions not yet implemented:', action);
          break;

        case SmartAlertActionType.Modal:
          // TODO: Implement modal handler when needed
          console.warn('Modal actions not yet implemented:', action);
          break;

        default:
          console.warn('Unknown action type:', action.type);
      }
    };
  }

  /**
   * Groups enhanced alerts by category
   */
  groupAlertsByCategory(alerts: (Alert & EnhancedAlert)[]): Map<string, (Alert & EnhancedAlert)[]> {
    const grouped = new Map<string, (Alert & EnhancedAlert)[]>();

    alerts.forEach((alert) => {
      const category = alert.category || 'Uncategorized';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      const categoryAlerts = grouped.get(category);
      if (categoryAlerts) {
        categoryAlerts.push(alert);
      }
    });

    return grouped;
  }

  /**
   * Gets count of alerts by menu path for navigation badges
   */
  getAlertCountsByMenuPath(alerts: (Alert & EnhancedAlert)[]): Map<string, { critical: number; warning: number }> {
    const counts = new Map<string, { critical: number; warning: number }>();

    alerts
      .filter((alert) => !alert.dismissed && alert.relatedMenuPath)
      .forEach((alert) => {
        const menuPath = alert.relatedMenuPath;
        if (!menuPath) return;

        const path = menuPath.join('.');
        const current = counts.get(path) || { critical: 0, warning: 0 };

        if ([AlertLevel.Critical, AlertLevel.Alert, AlertLevel.Emergency].includes(alert.level)) {
          current.critical++;
        } else if ([AlertLevel.Warning, AlertLevel.Error].includes(alert.level)) {
          current.warning++;
        }

        counts.set(path, current);
      });

    return counts;
  }
}
