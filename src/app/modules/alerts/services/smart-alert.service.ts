import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert, SmartAlertAction, SmartAlertActionType } from 'app/interfaces/smart-alert.interface';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { getAlertEnhancement } from './alert-enhancement.registry';

@Injectable({
  providedIn: 'root',
})
export class SmartAlertService {
  private router = inject(Router);
  private searchDirectives = inject(UiSearchDirectivesService);
  private document = inject(DOCUMENT);
  private window = this.document.defaultView as Window;

  /**
   * Enhances a basic alert with smart actions, contextual help, and metadata
   */
  enhanceAlert(alert: Alert): Alert & EnhancedAlert {
    const enhancement = getAlertEnhancement(alert.source, alert.klass, alert.formatted || alert.text);

    if (!enhancement) {
      return alert as Alert & EnhancedAlert;
    }

    // Extract fragment for highlighting if available
    const alertMessage = alert.formatted || alert.text;
    const extractedFragment = enhancement.extractFragment?.(alertMessage);

    // Filter out navigation actions that would navigate to the current page
    const currentUrl = this.router.url.split('?')[0].split('#')[0]; // Remove query params and fragments
    const filteredActions = enhancement.actions?.filter((action) => {
      if (action.type === SmartAlertActionType.Navigate && action.route) {
        const targetUrl = '/' + action.route.join('/');
        return targetUrl !== currentUrl;
      }
      return true;
    });

    // Bind handlers to actions and inject extracted fragment for navigation actions
    const boundActions = filteredActions?.map((action) => {
      if (action.type === SmartAlertActionType.Navigate && extractedFragment && !action.fragment) {
        return {
          ...action,
          fragment: extractedFragment,
          handler: this.createActionHandler({ ...action, fragment: extractedFragment }),
        };
      }
      return {
        ...action,
        handler: this.createActionHandler(action),
      };
    });

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
            const targetUrl = ('/' + action.route.join('/')).replace(/\/+/g, '/'); // Normalize multiple slashes
            const currentUrl = this.router.url.split('?')[0].split('#')[0];
            const isAlreadyOnPage = targetUrl === currentUrl;

            // Use UiSearch system when fragment is present for highlighting
            if (action.fragment) {
              // Set pending highlight element using the anchor
              this.searchDirectives.setPendingUiHighlightElement({
                anchor: action.fragment,
                hierarchy: ['Alert'],
              });

              // If already on the page, trigger highlight manually after delay
              // (no navigation event will fire, so global handler won't be triggered)
              if (isAlreadyOnPage) {
                setTimeout(() => {
                  // Trigger a manual check by subscribing to directiveAdded$
                  const pendingElement = {
                    anchor: action.fragment,
                    hierarchy: ['Alert'],
                  };
                  const directive = this.searchDirectives.get(pendingElement);

                  if (directive) {
                    directive.highlight(pendingElement);
                    this.searchDirectives.setPendingUiHighlightElement(null);
                  } else {
                    // Wait for directive to be registered
                    const subscription = this.searchDirectives.directiveAdded$.subscribe(() => {
                      const foundDirective = this.searchDirectives.get(pendingElement);
                      if (foundDirective) {
                        foundDirective.highlight(pendingElement);
                        this.searchDirectives.setPendingUiHighlightElement(null);
                        subscription.unsubscribe();
                      }
                    });

                    // Cleanup after 10 seconds
                    setTimeout(() => {
                      subscription.unsubscribe();
                    }, 10000);
                  }
                }, searchDelayConst * 2);
                return;
              }
            }

            // Navigate without fragment - the pending highlight system handles the highlighting
            this.router.navigate(action.route, {
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
   * Counts alerts for both the specific path and all parent paths
   * Example: alert with path ['data-protection', 'cloud-backup']
   * increments counts for both 'data-protection' and 'data-protection.cloud-backup'
   */
  getAlertCountsByMenuPath(
    alerts: (Alert & EnhancedAlert)[],
  ): Map<string, { critical: number; warning: number; info: number }> {
    const counts = new Map<string, { critical: number; warning: number; info: number }>();

    alerts
      .filter((alert) => !alert.dismissed && alert.relatedMenuPath)
      .forEach((alert) => {
        const menuPath = alert.relatedMenuPath;
        if (!menuPath) return;

        const isCritical = [
          AlertLevel.Critical,
          AlertLevel.Alert,
          AlertLevel.Emergency,
          AlertLevel.Error,
        ].includes(alert.level);
        const isWarning = [AlertLevel.Warning].includes(alert.level);
        const isInfo = [AlertLevel.Info, AlertLevel.Notice].includes(alert.level);

        // Count for each path segment and all parent paths
        // Example: ['data-protection', 'cloud-backup'] creates entries for:
        // - 'data-protection'
        // - 'data-protection.cloud-backup'
        for (let i = 1; i <= menuPath.length; i++) {
          const pathSegments = menuPath.slice(0, i);
          const path = pathSegments.join('.');
          const current = counts.get(path) || { critical: 0, warning: 0, info: 0 };

          if (isCritical) {
            current.critical++;
          } else if (isWarning) {
            current.warning++;
          } else if (isInfo) {
            current.info++;
          }

          counts.set(path, current);
        }
      });

    return counts;
  }
}
