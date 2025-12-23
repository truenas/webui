import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { Job } from 'app/interfaces/job.interface';
import { EnhancedAlert, SmartAlertAction, SmartAlertActionType } from 'app/interfaces/smart-alert.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { getAlertEnhancement } from './alert-enhancement.registry';

@Injectable({
  providedIn: 'root',
})
export class SmartAlertService {
  private router = inject(Router);
  private searchDirectives = inject(UiSearchDirectivesService);
  private document = inject(DOCUMENT);
  private window = this.document.defaultView as Window;
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);

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

    // Extract API params if available
    const extractedApiParams = enhancement.extractApiParams?.({
      args: alert.args,
      text: alert.text,
      formatted: alert.formatted,
    });

    // Bind handlers to actions and inject extracted fragment/apiParams
    const boundActions = filteredActions?.map((action) => {
      let enhancedAction = { ...action };

      // Inject extracted fragment for navigation actions
      if (action.type === SmartAlertActionType.Navigate && extractedFragment && !action.fragment) {
        enhancedAction = { ...enhancedAction, fragment: extractedFragment };
      }

      // Inject extracted API params for API call actions
      if (action.type === SmartAlertActionType.ApiCall && extractedApiParams !== undefined && !action.apiParams) {
        enhancedAction = { ...enhancedAction, apiParams: extractedApiParams };
      }

      return {
        ...enhancedAction,
        handler: this.createActionHandler(enhancedAction, alert),
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
  private createActionHandler(action: SmartAlertAction, alert: Alert): () => void {
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
          if (action.apiMethod && action.apiParams !== undefined) {
            this.handleApiCall(action, alert);
          } else {
            console.error('API call action missing required apiMethod or apiParams:', action);
          }
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
   * Handles API call actions with confirmation dialogs and feedback
   */
  private handleApiCall(action: SmartAlertAction, alert: Alert): void {
    const taskName = this.extractTaskName(alert);
    const confirmationMessage = this.translate.instant('Run «{name}» now?', { name: taskName });
    const relatedRoute = this.getRelatedRouteForAlert(alert);

    // Track which notifications we've shown to prevent duplicates
    let hasShownStarted = false;
    let hasShownCompleted = false;

    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: confirmationMessage,
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        // Extract task ID from apiParams (should be the task ID)
        const taskId = action.apiParams as number;

        // Validate that we have a valid API method and task ID
        if (!action.apiMethod || taskId === undefined || taskId === null) {
          throw new Error(`Invalid API call parameters: method=${action.apiMethod}, taskId=${taskId}`);
        }

        // Cast apiMethod to any to avoid TypeScript error with dynamic method names
        // The method names are validated at registry definition time, so this is safe
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.api.job(action.apiMethod as any, [taskId]);
      }),
    ).subscribe({
      next: (job: Job) => {
        // Show "started" notification only once when job first enters Running state
        if (job.state === JobState.Running && !hasShownStarted) {
          hasShownStarted = true;
          this.snackbar.success(
            this.translate.instant('Task «{name}» has started.', { name: taskName }),
          );
          // Refresh the page immediately when task starts so user sees the running state
          this.refreshPageIfOnTaskRoute(relatedRoute);
        } else if ((job.state === JobState.Success || job.state === JobState.Finished) && !hasShownCompleted) {
          // Show "completed" notification only once when job finishes successfully
          hasShownCompleted = true;
          this.snackbar.success(
            this.translate.instant('Task «{name}» completed successfully.', { name: taskName }),
          );
          // Refresh the page again on completion to show final state
          this.refreshPageIfOnTaskRoute(relatedRoute);
        } else if ((job.state === JobState.Failed || job.state === JobState.Aborted) && !hasShownCompleted) {
          // Handle jobs that fail or are aborted without showing started notification
          hasShownCompleted = true;
          if (!hasShownStarted) {
            // Job failed before we could show "started", just show failure
            this.snackbar.error(
              this.translate.instant('Task «{name}» failed to start.', { name: taskName }),
            );
          } else {
            // Job started but then failed
            this.snackbar.error(
              this.translate.instant('Task «{name}» failed.', { name: taskName }),
            );
          }
          // Refresh the page to show the failed state
          this.refreshPageIfOnTaskRoute(relatedRoute);
        }
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        // Also refresh on error in case the task was started
        this.refreshPageIfOnTaskRoute(relatedRoute);
      },
    });
  }

  /**
   * Gets the related route for an alert based on its enhancement
   */
  private getRelatedRouteForAlert(alert: Alert): string | null {
    const enhancement = getAlertEnhancement(alert.source, alert.klass, alert.formatted || alert.text);
    if (enhancement?.relatedMenuPath) {
      return '/' + enhancement.relatedMenuPath.join('/');
    }
    return null;
  }

  /**
   * Refreshes the current page if user is on the related task route
   */
  private refreshPageIfOnTaskRoute(relatedRoute: string | null): void {
    if (!relatedRoute) {
      return;
    }

    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    if (currentUrl === relatedRoute) {
      // User is on the task page, reload the route to refresh the data
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([relatedRoute]);
      });
    }
  }

  /**
   * Extracts task name from alert message
   */
  private extractTaskName(alert: Alert): string {
    const message = alert.formatted || alert.text;
    // Try to extract task name from quotes in the message
    const regex = /"([^"]+)"/;
    const match = regex.exec(message);
    if (match?.[1]) {
      return match[1];
    }
    // Fallback to using the alert class name
    return alert.klass || 'Task';
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
