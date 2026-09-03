import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent, tnIconMarker } from '@truenas/ui-components';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { stripQueryAndFragment } from 'app/helpers/url.helper';
import { AlertWithDuplicates } from 'app/interfaces/smart-alert.interface';
import { AlertNavBadgeService } from 'app/modules/alerts/services/alert-nav-badge.service';
import { dismissAlertPressed } from 'app/modules/alerts/store/alert.actions';
import { criticalLevels } from 'app/modules/alerts/store/alert.selectors';
import {
  consolidateAlerts, getAlertConsolidationKey, getConsolidatedDetailMessages, getConsolidatedSummary,
} from 'app/modules/alerts/utils/alert-consolidation.utils';
import { getAlertBannerMenuPaths, isRouteUnderMenuPath } from 'app/modules/alerts/utils/alert-menu-path.utils';
import { hasAlertDetails } from 'app/modules/alerts/utils/alert-summary.utils';
import { AppState } from 'app/store';

/**
 * Everything a banner renders, prepared once per alert change instead of on every
 * change-detection pass of the page header.
 */
export interface PageAlertView {
  /**
   * Identifies the banner across refreshes. Not the alert id: consolidation picks the
   * newest alert as the representative, so its id changes whenever a newer alert of the
   * same kind arrives, which would collapse a banner the user had expanded.
   */
  expansionKey: string;
  cssClass: string;
  icon: string;
  duplicateCount: number;
  /** More than one alert instance, which is what the count badge reports. */
  hasDuplicates: boolean;
  /** More than one object, which is what decides the headline and the detail list. */
  hasMultipleObjects: boolean;
  duplicateTooltip: string;
  summary: string;
  fullMessage: string;
  hasDetails: boolean;
  /** Whether expanding renders anything below the message line. */
  hasExpandedContent: boolean;
  /** One entry per consolidated alert. Empty for a single alert, which expands in place. */
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
    MatTooltip,
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

  // The view model below caches translated strings, so it has to re-run on a language switch.
  private langChange = toSignal(this.translate.onLangChange, { initialValue: null });

  // Track which banners are expanded, by consolidation key
  private expandedAlertKeys = signal<Set<string>>(new Set());

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
      // Scope the banner by bannerMenuPath when provided, otherwise fall back to relatedMenuPath,
      // plus any extraMenuPaths. This lets the banner target a narrower route than the nav badge
      // (e.g. API keys live under /credentials/users/api-keys but the badge stays on the
      // Credentials menu), or a wider one for alerts that span two feature areas.
      const menuPaths = getAlertBannerMenuPaths(alert);
      if (!menuPaths.length) {
        return false;
      }

      return menuPaths.some((menuPath) => isRouteUnderMenuPath(menuPath, pathSegments));
    });
  });

  /**
   * Banners sorted by severity (critical first, then warnings, then info).
   */
  protected sortedPageAlerts = computed<PageAlertView[]>(() => {
    // Read the lang-change signal so the cached translations below are rebuilt on a switch.
    this.langChange();

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
    const summary = getConsolidatedSummary(alert, this.translate);
    const detailMessages = getConsolidatedDetailMessages(alert);

    return {
      expansionKey: getAlertConsolidationKey(alert),
      cssClass: this.getAlertClass(alert.level),
      icon: this.getAlertIcon(alert.level),
      duplicateCount: alert.duplicateCount,
      hasDuplicates,
      hasMultipleObjects: alert.objectCount > 1,
      duplicateTooltip: this.translate.instant('{count} system-wide instances of this alert', {
        count: alert.duplicateCount,
      }),
      summary,
      fullMessage: alert.formatted,
      hasDetails: detailMessages.length > 0
        || hasAlertDetails(alert.formatted)
        || Boolean(alert.contextualHelp)
        || Boolean(alert.documentationUrl),
      hasExpandedContent: detailMessages.length > 0
        || Boolean(alert.contextualHelp)
        || Boolean(alert.documentationUrl),
      detailMessages,
      contextualHelp: alert.contextualHelp,
      documentationUrl: alert.documentationUrl,
      dismissAriaLabel: hasDuplicates
        ? this.translate.instant('Dismiss all {count} instances', { count: alert.duplicateCount })
        : this.translate.instant('Dismiss alert: {message}', { message: summary }),
      dismissTooltip: hasDuplicates
        ? this.translate.instant('Dismiss all {count} system-wide instances', { count: alert.duplicateCount })
        : this.translate.instant('Dismiss'),
      allIds: alert.allIds,
    };
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
   * Check if a banner is currently expanded
   */
  protected isExpanded(expansionKey: string): boolean {
    return this.expandedAlertKeys().has(expansionKey);
  }

  /**
   * Toggle expansion of a banner
   */
  protected toggleExpansion(expansionKey: string): void {
    const expanded = new Set(this.expandedAlertKeys());
    if (expanded.has(expansionKey)) {
      expanded.delete(expansionKey);
    } else {
      expanded.add(expansionKey);
    }
    this.expandedAlertKeys.set(expanded);
  }
}
