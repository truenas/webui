import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent, tnIconMarker, TnTooltipDirective } from '@truenas/ui-components';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { stripQueryAndFragment } from 'app/helpers/url.helper';
import { AlertWithDuplicates } from 'app/interfaces/smart-alert.interface';
import { AlertNavBadgeService } from 'app/modules/alerts/services/alert-nav-badge.service';
import { dismissAlertPressed } from 'app/modules/alerts/store/alert.actions';
import { criticalLevels } from 'app/modules/alerts/store/alert.selectors';
import { consolidateAlerts } from 'app/modules/alerts/utils/alert-consolidation.utils';
import { getAlertSummary, hasAlertDetails } from 'app/modules/alerts/utils/alert-summary.utils';
import { AppState } from 'app/store';

/**
 * Displays alerts relevant to the current page at the top of the page content.
 *
 * Filters alerts based on:
 * - Current route path matching alert's relatedMenuPath
 * - Only shows unread alerts
 * - Alerts of the same kind are consolidated into a single banner
 * - Only a concise summary is shown; the full text is behind "Show More"
 */
@Component({
  selector: 'ix-page-alerts',
  templateUrl: './page-alerts.component.html',
  styleUrls: ['./page-alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TnIconComponent,
    TnTooltipDirective,
    TranslateModule,
  ],
})
export class PageAlertsComponent {
  private router = inject(Router);
  private store$ = inject<Store<AppState>>(Store);
  private alertNavBadgeService = inject(AlertNavBadgeService);
  private translate = inject(TranslateService);

  // Get all enhanced alerts
  private allAlerts = this.alertNavBadgeService.getEnhancedAlerts();

  // Get current route segments
  private currentRoute = toSignal(this.router.events, { initialValue: null });

  // Track which alerts are expanded (by id of the consolidated alert)
  private expandedAlertIds = signal<Set<string>>(new Set());

  /**
   * Every unread alert, consolidated by kind. Consolidation happens before the route
   * filter below so a banner always covers the alert's system-wide occurrences.
   */
  private consolidatedAlerts = computed(() => {
    return consolidateAlerts(this.allAlerts().filter((alert) => !alert.dismissed));
  });

  /**
   * Split the current route into path segments, stripping any query string and fragment
   * so the last segment isn't polluted (e.g. `api-keys?userName=root` -> `api-keys`).
   */
  private getPathSegments(): string[] {
    return stripQueryAndFragment(this.router.url).split('/').filter((segment) => segment);
  }

  /**
   * Filter alerts relevant to the current page
   */
  protected pageAlerts = computed<AlertWithDuplicates[]>(() => {
    // Trigger recomputation when route changes
    this.currentRoute();

    const pathSegments = this.getPathSegments();

    return this.consolidatedAlerts().filter((alert) => {
      // Scope the banner by bannerMenuPath when provided, otherwise fall back to relatedMenuPath.
      // This lets the banner target a narrower route than the nav badge (e.g. API keys live under
      // /credentials/users/api-keys but the badge stays on the Credentials menu).
      const menuPath = alert.bannerMenuPath ?? alert.relatedMenuPath;
      if (!menuPath) {
        return false;
      }

      // Match if current URL is at or below the alert's menu path.
      // Dataset routes use /datasets/:datasetId, so ['datasets'] must still match /datasets/tank.
      return menuPath.length <= pathSegments.length
        && menuPath.every((segment, index) => pathSegments[index] === segment);
    });
  });

  /**
   * Get all page alerts sorted by severity (critical first, then warnings, then info)
   */
  protected sortedPageAlerts = computed(() => {
    const alerts = [...this.pageAlerts()];

    // Sort by severity: critical -> warning -> info
    return alerts.sort((a, b) => {
      const getSeverityOrder = (level: AlertLevel): number => {
        if (criticalLevels.includes(level)) {
          return 0; // Critical
        }
        if (level === AlertLevel.Warning) {
          return 1; // Warning
        }
        return 2; // Info
      };

      return getSeverityOrder(a.level) - getSeverityOrder(b.level);
    });
  });

  /**
   * Check if there are any page alerts to show
   */
  protected hasAlerts = computed(() => this.pageAlerts().length > 0);

  /**
   * Dismiss an alert (and every alert it consolidates)
   */
  protected onDismiss(alert: AlertWithDuplicates): void {
    this.store$.dispatch(dismissAlertPressed({ ids: alert.allIds }));
  }

  /**
   * Get icon for alert level
   */
  protected getAlertIcon(level: AlertLevel): string {
    switch (level) {
      case AlertLevel.Critical:
      case AlertLevel.Alert:
      case AlertLevel.Emergency:
      case AlertLevel.Error:
        return tnIconMarker('alert-circle', 'mdi');
      case AlertLevel.Warning:
        return tnIconMarker('alert', 'mdi');
      case AlertLevel.Info:
      case AlertLevel.Notice:
      default:
        return tnIconMarker('information', 'mdi');
    }
  }

  /**
   * Get CSS class for alert level
   */
  protected getAlertClass(level: AlertLevel): string {
    switch (level) {
      case AlertLevel.Critical:
      case AlertLevel.Alert:
      case AlertLevel.Emergency:
      case AlertLevel.Error:
        return 'critical';
      case AlertLevel.Warning:
        return 'warning';
      case AlertLevel.Info:
      case AlertLevel.Notice:
      default:
        return 'info';
    }
  }

  /**
   * Concise headline for the banner: the group summary when several alerts were
   * consolidated, otherwise the first sentence of the alert's own message.
   */
  protected getSummary(alert: AlertWithDuplicates): string {
    if (this.hasDuplicates(alert) && alert.groupSummary) {
      return this.translate.instant(alert.groupSummary, { count: alert.duplicateCount });
    }
    return getAlertSummary(alert.formatted);
  }

  /**
   * Messages shown when the banner is expanded, one per consolidated alert.
   */
  protected getDetailMessages(alert: AlertWithDuplicates): string[] {
    return alert.groupedMessages ?? [alert.formatted];
  }

  /**
   * Check if the banner hides anything worth expanding
   */
  protected hasDetails(alert: AlertWithDuplicates): boolean {
    return this.hasDuplicates(alert)
      || hasAlertDetails(alert.formatted)
      || Boolean(alert.contextualHelp)
      || Boolean(alert.documentationUrl);
  }

  /**
   * Check if alert is currently expanded
   */
  protected isExpanded(alertId: string): boolean {
    return this.expandedAlertIds().has(alertId);
  }

  /**
   * Toggle expansion of alert message
   */
  protected toggleExpansion(alertId: string): void {
    const expanded = new Set(this.expandedAlertIds());
    if (expanded.has(alertId)) {
      expanded.delete(alertId);
    } else {
      expanded.add(alertId);
    }
    this.expandedAlertIds.set(expanded);
  }

  /**
   * Check if alert consolidates more than one instance
   */
  protected hasDuplicates(alert: AlertWithDuplicates): boolean {
    return alert.duplicateCount > 1;
  }

  /**
   * Get dismiss button aria-label for accessibility
   */
  protected getDismissAriaLabel(alert: AlertWithDuplicates): string {
    if (this.hasDuplicates(alert)) {
      return this.translate.instant('Dismiss all {count} instances', {
        count: alert.duplicateCount,
      });
    }
    return this.translate.instant('Dismiss alert: {message}', { message: this.getSummary(alert) });
  }

  /**
   * Get dismiss button tooltip
   */
  protected getDismissTooltip(alert: AlertWithDuplicates): string {
    if (this.hasDuplicates(alert)) {
      return this.translate.instant('Dismiss all {count} system-wide instances', {
        count: alert.duplicateCount,
      });
    }
    return this.translate.instant('Dismiss');
  }

  /**
   * Get duplicate count badge tooltip
   */
  protected getDuplicateTooltip(alert: AlertWithDuplicates): string {
    return this.translate.instant('{count} system-wide instances of this alert', {
      count: alert.duplicateCount,
    });
  }
}
