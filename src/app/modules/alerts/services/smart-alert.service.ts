import { DOCUMENT } from '@angular/common';
import { Injectable, inject, isDevMode } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  distinctUntilChanged, filter, first, from, of, switchMap, takeUntil, tap, timeout,
} from 'rxjs';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { JobState } from 'app/enums/job-state.enum';
import { stripQueryAndFragment } from 'app/helpers/url.helper';
import { Alert } from 'app/interfaces/alert.interface';
import {
  EnhanceAlertOptions, EnhancedAlert, SmartAlertAction, SmartAlertActionType, SmartAlertCategory,
} from 'app/interfaces/smart-alert.interface';
import { isRoutePlaceholder, routePlaceholders } from 'app/modules/alerts/constants/route-placeholders.const';
import { criticalLevels } from 'app/modules/alerts/store/alert.selectors';
import { getAlertBadgeMenuPaths } from 'app/modules/alerts/utils/alert-menu-path.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { getAlertEnhancement } from './alert-enhancement.registry';

/**
 * Time to wait before attempting to highlight an element after navigation (milliseconds)
 */
const highlightDelayMs = searchDelayConst * 2;

/**
 * Maximum time to wait for a highlight directive to be registered before giving up (milliseconds)
 */
const highlightTimeoutMs = 10000;

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
  enhanceAlert(alert: Alert, options: EnhanceAlertOptions = {}): Alert & EnhancedAlert {
    const isConsolidated = Boolean(options.isConsolidated);
    const enhancement = getAlertEnhancement(
      alert.source,
      alert.klass,
      alert.formatted || alert.text,
      alert, // Pass full alert for conditional enhancement resolution
    );

    if (!enhancement) {
      return {
        ...alert,
        category: SmartAlertCategory.System,
      } as Alert & EnhancedAlert;
    }

    // Extract fragment for highlighting if available
    const alertMessage = alert.formatted || alert.text;
    const extractedFragment = enhancement.extractFragment?.(alertMessage);

    // Filter out navigation actions that would navigate to the current page
    const currentUrl = stripQueryAndFragment(this.router.url);
    const filteredActions = enhancement.actions?.filter((action) => {
      // A consolidated entry stands for several objects, so a task rerun resolved from one
      // alert's args would silently act on that one alert only.
      if (isConsolidated && action.type === SmartAlertActionType.RunTask) {
        return false;
      }
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
    const boundActions = filteredActions?.map((action): SmartAlertAction | null => {
      let enhancedAction = { ...action };

      // A route resolved from one alert's args points at that alert's object, so it is
      // wrong for an entry that stands for several of them.
      if (isConsolidated && action.type === SmartAlertActionType.Navigate && action.route?.some(isRoutePlaceholder)) {
        return null;
      }

      // Inject extracted fragment for navigation actions. Skipped for consolidated entries:
      // the highlight would single out the representative alert's object.
      if (action.type === SmartAlertActionType.Navigate && extractedFragment && !action.fragment && !isConsolidated) {
        enhancedAction = { ...enhancedAction, fragment: extractedFragment };
      }

      // Replace route placeholders with extracted params for navigation actions
      if (action.type === SmartAlertActionType.Navigate && extractedApiParams !== undefined && action.route) {
        const updatedRoute = action.route.map((segment) => {
          // Check if segment is a placeholder and replace with extracted value
          if (isRoutePlaceholder(segment)) {
            // If extractedApiParams is an object, look up the key by placeholder value
            if (typeof extractedApiParams === 'object' && extractedApiParams !== null) {
              const key = Object.keys(routePlaceholders).find(
                (placeholderKey) => routePlaceholders[placeholderKey as keyof typeof routePlaceholders] === segment,
              );
              if (key && key in extractedApiParams) {
                return String((extractedApiParams as Record<string, unknown>)[key]);
              }
              if (isDevMode()) {
                console.warn(`Missing placeholder value for ${segment} in extractedApiParams:`, extractedApiParams);
              }
              return segment; // Return placeholder unchanged if key not found
            }
            // If extractedApiParams is a primitive, use it directly (backward compatibility)
            return String(extractedApiParams);
          }
          return segment;
        });

        // Check if any placeholders remain unreplaced
        const hasUnreplacedPlaceholders = updatedRoute.some(isRoutePlaceholder);
        if (hasUnreplacedPlaceholders) {
          if (isDevMode()) {
            console.warn('Route has unreplaced placeholders, falling back to related menu path:', updatedRoute);
          }
          // Don't set the route - the action will be filtered out or use relatedMenuPath
          enhancedAction = { ...enhancedAction, route: undefined };
        } else {
          enhancedAction = { ...enhancedAction, route: updatedRoute };
        }
      }

      // Inject extracted API params for run task actions
      if (action.type === SmartAlertActionType.RunTask && extractedApiParams !== undefined && !action.apiParams) {
        enhancedAction = { ...enhancedAction, apiParams: extractedApiParams };
      }

      return {
        ...enhancedAction,
        handler: this.createActionHandler(enhancedAction, alert),
      };
    }).filter((action): action is SmartAlertAction => action !== null);

    return {
      ...alert,
      category: enhancement.category,
      actions: boundActions,
      groupSummary: enhancement.groupSummary,
      contextualHelp: enhancement.contextualHelp,
      detailedHelp: enhancement.detailedHelp,
      documentationUrl: enhancement.documentationUrl,
      relatedMenuPath: enhancement.relatedMenuPath,
      bannerMenuPath: enhancement.bannerMenuPath,
      extraMenuPaths: enhancement.extraMenuPaths,
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
            const currentUrl = stripQueryAndFragment(this.router.url);
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
                    // Wait for directive to be registered with automatic cleanup
                    // Observable completes on: first match, timeout, or navigation start
                    const navigationStart$ = this.router.events.pipe(
                      filter((event) => event instanceof NavigationStart),
                    );

                    this.searchDirectives.directiveAdded$.pipe(
                      filter(() => !!this.searchDirectives.get(pendingElement)),
                      first(),
                      timeout(highlightTimeoutMs),
                      takeUntil(navigationStart$),
                    ).subscribe({
                      next: () => {
                        const foundDirective = this.searchDirectives.get(pendingElement);
                        if (foundDirective) {
                          foundDirective.highlight(pendingElement);
                          this.searchDirectives.setPendingUiHighlightElement(null);
                        }
                      },
                      error: () => {
                        // Timeout or navigation occurred, no action needed
                      },
                    });
                  }
                }, highlightDelayMs);
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

        case SmartAlertActionType.RunTask:
          if (action.apiMethod && action.apiParams !== undefined) {
            this.handleRunTask(action, alert);
          } else {
            if (isDevMode()) {
              console.error('Run task action missing required apiMethod or apiParams:', action);
            }
          }
          break;

        case SmartAlertActionType.Modal:
          // TODO: Implement modal handler when needed
          if (isDevMode()) {
            console.warn('Modal actions not yet implemented:', action);
          }
          break;

        default:
          if (isDevMode()) {
            console.warn('Unknown action type:', action.type);
          }
      }
    };
  }

  /**
   * Handles run task actions for task re-run operations.
   * Shows confirmation dialog and tracks job progress.
   */
  private handleRunTask(action: SmartAlertAction, alert: Alert): void {
    const taskName = this.extractTaskName(alert);
    const confirmationMessage = this.translate.instant('Run «{name}» now?', { name: taskName });
    const relatedRoute = this.getRelatedRouteForAlert(alert);
    const currentUrl = stripQueryAndFragment(this.router.url);
    const navigation$ = relatedRoute && currentUrl !== relatedRoute
      ? from(this.router.navigateByUrl(relatedRoute))
      : of(true);

    navigation$.pipe(
      switchMap(() => this.dialogService.confirm({
        title: this.translate.instant('Run Now'),
        message: confirmationMessage,
        hideCheckbox: true,
      })),
      filter(Boolean),
      switchMap(() => {
        // Extract task ID from apiParams (should be the task ID)
        const taskId = action.apiParams as number;

        // Validate that we have a valid API method and task ID
        if (!action.apiMethod || taskId === undefined || taskId === null || typeof taskId !== 'number') {
          throw new Error(`Invalid API call parameters: method=${action.apiMethod}, taskId=${taskId}, type=${typeof taskId}`);
        }

        // Cast apiMethod to any to avoid TypeScript error with dynamic method names
        // The method names are validated at registry definition time, so this is safe
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.api.job(action.apiMethod as any, [taskId]).pipe(
          distinctUntilChanged((prev, curr) => prev.state === curr.state),
          tap((job) => {
            if (job.state === JobState.Running) {
              this.snackbar.success(
                this.translate.instant('Task «{name}» has started.', { name: taskName }),
              );
              this.refreshPageIfOnTaskRoute(relatedRoute);
            } else if (job.state === JobState.Success) {
              this.snackbar.success(
                this.translate.instant('Task «{name}» completed successfully.', { name: taskName }),
              );
              this.refreshPageIfOnTaskRoute(relatedRoute);
            } else if (job.state === JobState.Failed || job.state === JobState.Aborted) {
              this.snackbar.error(
                this.translate.instant('Task «{name}» failed.', { name: taskName }),
              );
              this.refreshPageIfOnTaskRoute(relatedRoute);
            }
          }),
        );
      }),
      this.errorHandler.withErrorHandler(),
    ).subscribe();
  }

  /**
   * Gets the related route for an alert based on its enhancement
   */
  private getRelatedRouteForAlert(alert: Alert): string | null {
    const enhancement = getAlertEnhancement(
      alert.source,
      alert.klass,
      alert.formatted || alert.text,
      alert, // Pass full alert for conditional enhancement resolution
    );
    // Prefer the banner scope (where the alert's data actually lives) so the page is refreshed
    // on the correct route, falling back to the nav-badge path when no banner override is set.
    const menuPath = enhancement?.bannerMenuPath ?? enhancement?.relatedMenuPath;
    if (menuPath) {
      return '/' + menuPath.join('/');
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

    const currentUrl = stripQueryAndFragment(this.router.url);
    if (currentUrl === relatedRoute) {
      // User is on the task page, reload the route to refresh the data
      // This uses the "navigate away and back" pattern which is necessary because:
      // 1. Angular doesn't reload a route when navigating to the same URL
      // 2. Components may not have explicit data reload mechanisms
      // 3. This ensures fresh data from the server after task execution
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
  groupAlertsByCategory<T extends Alert & EnhancedAlert>(alerts: T[]): Map<string, T[]> {
    const grouped = new Map<string, T[]>();

    alerts.forEach((alert) => {
      // All alerts should have a category assigned by enhanceAlert()
      const category = alert.category || SmartAlertCategory.System;
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
   * Counts all alert instances for both the specific path and all parent paths
   * Example: alert with path ['data-protection', 'cloud-backup']
   * increments counts for both 'data-protection' and 'data-protection.cloud-backup'
   *
   * Alerts that declare `extraMenuPaths` are counted under those paths too, so an
   * alert spanning two feature areas badges both (e.g. tiering: Storage + Datasets).
   *
   * Counts all alert instances to match what users see in the alert panel.
   * For example, if there are 2 instances of the same alert, it counts as 2.
   */
  getAlertCountsByMenuPath(
    alerts: (Alert & EnhancedAlert)[],
  ): Map<string, { critical: number; warning: number; info: number }> {
    const counts = new Map<string, { critical: number; warning: number; info: number }>();

    // Count all alert instances by path
    alerts
      .filter((alert) => !alert.dismissed)
      .forEach((alert) => {
        const menuPaths = getAlertBadgeMenuPaths(alert);
        if (!menuPaths.length) return;

        const isCritical = criticalLevels.includes(alert.level);
        const isWarning = [AlertLevel.Warning].includes(alert.level);
        const isInfo = [AlertLevel.Info, AlertLevel.Notice].includes(alert.level);

        // Count for each path segment and all parent paths
        // Example: ['data-protection', 'cloud-backup'] creates entries for:
        // - 'data-protection'
        // - 'data-protection.cloud-backup'
        const countedPaths = new Set<string>();
        menuPaths.forEach((menuPath) => {
          for (let i = 1; i <= menuPath.length; i++) {
            const path = menuPath.slice(0, i).join('.');
            // A path shared by two of the alert's menu paths must only be counted once.
            if (countedPaths.has(path)) continue;
            countedPaths.add(path);

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
      });

    return counts;
  }
}
