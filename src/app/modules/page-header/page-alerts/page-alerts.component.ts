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
 * Everything a banner renders, prepared once per alert change instead of on every
 * change-detection pass of the page header.
 */
export interface PageAlertView {
  id: string;
  cssClass: string;
  icon: string;
  duplicateCount: number;
  hasDuplicates: boolean;
  duplicateTooltip: string;
  summary: string;
  hasDetails: boolean;
  detailMessages: string[];
  contextualHelp: string | undefined;
  documentationUrl: string | undefined;
  dismissAriaLabel: string;
  dismissTooltip: string;
  allIds: string[];
}

function getSeverityOrder(level: AlertLevel): number {
  if (criticalLevels.includes(level)) {
    return 0;
  }
  return level === AlertLevel.Warning ? 1 : 2;
}

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
  private pageAlerts = computed<AlertWithDuplicates[]>(() => {
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
   * Banners sorted by severity (critical first, then warnings, then info).
   */
  protected sortedPageAlerts = computed<PageAlertView[]>(() => {
    return [...this.pageAlerts()]
      .sort((a, b) => getSeverityOrder(a.level) - getSeverityOrder(b.level))
      .map((alert) => this.toView(alert));
  });

  /**
   * Check if there are any page alerts to show
   */
  protected hasAlerts = computed(() => this.sortedPageAlerts().length > 0);

  private toView(alert: AlertWithDuplicates): PageAlertView {
    const hasDuplicates = alert.duplicateCount > 1;

    return {
      id: alert.id,
      cssClass: this.getAlertClass(alert.level),
      icon: this.getAlertIcon(alert.level),
      duplicateCount: alert.duplicateCount,
      hasDuplicates,
      duplicateTooltip: this.translate.instant('{count} system-wide instances of this alert', {
        count: alert.duplicateCount,
      }),
      summary: this.getSummary(alert),
      hasDetails: hasDuplicates
        || hasAlertDetails(alert.formatted)
        || Boolean(alert.contextualHelp)
        || Boolean(alert.documentationUrl),
      detailMessages: alert.groupedMessages ?? [alert.formatted],
      contextualHelp: alert.contextualHelp,
      documentationUrl: alert.documentationUrl,
      dismissAriaLabel: hasDuplicates
        ? this.translate.instant('Dismiss all {count} instances', { count: alert.duplicateCount })
        : this.translate.instant('Dismiss alert: {message}', { message: this.getSummary(alert) }),
      dismissTooltip: hasDuplicates
        ? this.translate.instant('Dismiss all {count} system-wide instances', { count: alert.duplicateCount })
        : this.translate.instant('Dismiss'),
      allIds: alert.allIds,
    };
  }

  /**
   * Concise headline for the banner: the group summary when several alerts were
   * consolidated, otherwise the first sentence of the alert's own message.
   */
  private getSummary(alert: AlertWithDuplicates): string {
    if (alert.duplicateCount > 1 && alert.groupSummary) {
      return this.translate.instant(alert.groupSummary, { count: alert.duplicateCount });
    }
    return getAlertSummary(alert.formatted);
  }

  /**
   * Dismiss an alert (and every alert it consolidates)
   */
  protected onDismiss(alert: PageAlertView): void {
    this.store$.dispatch(dismissAlertPressed({ ids: alert.allIds }));
  }

  /**
   * Get icon for alert level
   */
  private getAlertIcon(level: AlertLevel): string {
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
  private getAlertClass(level: AlertLevel): string {
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
}
