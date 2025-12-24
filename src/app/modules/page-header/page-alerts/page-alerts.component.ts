import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert, SmartAlertAction } from 'app/interfaces/smart-alert.interface';
import { AlertNavBadgeService } from 'app/modules/alerts/services/alert-nav-badge.service';
import { dismissAlertPressed } from 'app/modules/alerts/store/alert.actions';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppState } from 'app/store';

/**
 * Displays alerts relevant to the current page at the top of the page content.
 *
 * Filters alerts based on:
 * - Current route path matching alert's relatedMenuPath
 * - Only shows unread alerts
 * - Grouped and styled for page-level display
 */
@Component({
  selector: 'ix-page-alerts',
  templateUrl: './page-alerts.component.html',
  styleUrls: ['./page-alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    MatTooltip,
    TranslateModule,
  ],
})
export class PageAlertsComponent {
  private router = inject(Router);
  private store$ = inject<Store<AppState>>(Store);
  private alertNavBadgeService = inject(AlertNavBadgeService);

  // Get all enhanced alerts
  private allAlerts = this.alertNavBadgeService.getEnhancedAlerts();

  // Get current route segments
  private currentRoute = toSignal(this.router.events, { initialValue: null });

  // Track which alerts are expanded (by UUID)
  private expandedAlertIds = signal<Set<string>>(new Set());

  // Maximum length before truncating alert message
  private readonly maxMessageLength = 200;

  /**
   * Filter alerts relevant to the current page
   */
  protected pageAlerts = computed(() => {
    // Trigger recomputation when route changes
    this.currentRoute();

    const alerts = this.allAlerts();
    const url = this.router.url;

    // Parse current route into segments
    const pathSegments = url.split('/').filter((segment) => segment && !segment.startsWith('?'));

    // First, count ALL duplicates by key (across all pages) to get the true duplicate count
    const allAlertsByKey = new Map<string, (Alert & EnhancedAlert)[]>();
    alerts.filter((alert) => !alert.dismissed).forEach((alert) => {
      if (!allAlertsByKey.has(alert.key)) {
        allAlertsByKey.set(alert.key, []);
      }
      const group = allAlertsByKey.get(alert.key);
      if (group) {
        group.push(alert);
      }
    });

    // Create a map of key -> total duplicate count and all IDs
    const duplicateInfo = new Map<string, { count: number; allIds: string[] }>();
    allAlertsByKey.forEach((alertGroup, key) => {
      duplicateInfo.set(key, {
        count: alertGroup.length,
        allIds: alertGroup.map((a) => a.id),
      });
    });

    // Filter alerts that match current route
    const filteredAlerts = alerts.filter((alert) => {
      if (!alert.relatedMenuPath || alert.dismissed) {
        return false;
      }

      // Check if alert's menu path EXACTLY matches current route
      // Example: alert path ['storage'] matches ONLY /storage (not /storage/disks)
      // Example: alert path ['data-protection', 'cloud-backup'] matches ONLY /data-protection/cloud-backup
      const menuPath = alert.relatedMenuPath;

      // Require exact match: same length and all segments match
      return menuPath.length === pathSegments.length
        && menuPath.every((segment, index) => pathSegments[index] === segment);
    });

    // Group filtered alerts by key (to show only one per key on the page)
    const alertsByKey = new Map<string, (Alert & EnhancedAlert)[]>();
    filteredAlerts.forEach((alert) => {
      if (!alertsByKey.has(alert.key)) {
        alertsByKey.set(alert.key, []);
      }
      const group = alertsByKey.get(alert.key);
      if (group) {
        group.push(alert);
      }
    });

    // For each group, keep the most recent alert and add TOTAL duplicate count (from all pages)
    const uniqueAlerts: (Alert & EnhancedAlert & { duplicateCount: number; allIds: string[] })[] = [];
    alertsByKey.forEach((alertGroup) => {
      // Sort by datetime to get most recent (use toSorted to avoid mutation)
      const sorted = alertGroup.toSorted((a, b) => (b.datetime?.$date || 0) - (a.datetime?.$date || 0));
      const mostRecent = sorted[0];

      // Get the total duplicate count across all pages (not just this page)
      const info = duplicateInfo.get(mostRecent.key);

      uniqueAlerts.push({
        ...mostRecent,
        duplicateCount: info?.count || 1,
        allIds: info?.allIds || [mostRecent.id],
      });
    });

    return uniqueAlerts;
  });

  /**
   * Group alerts by severity for display
   */
  protected groupedAlerts = computed(() => {
    const alerts = this.pageAlerts();

    const critical = alerts.filter((a) => a.level === AlertLevel.Critical
      || a.level === AlertLevel.Alert
      || a.level === AlertLevel.Emergency
      || a.level === AlertLevel.Error);

    const warnings = alerts.filter((a) => a.level === AlertLevel.Warning);

    const info = alerts.filter((a) => a.level === AlertLevel.Info
      || a.level === AlertLevel.Notice);

    return { critical, warnings, info };
  });

  /**
   * Check if there are any page alerts to show
   */
  protected hasAlerts = computed(() => this.pageAlerts().length > 0);

  /**
   * Filter out actions that navigate to current or parent route
   */
  protected getVisibleActions = computed(() => {
    const url = this.router.url;
    const pathSegments = url.split('/').filter((segment) => segment && !segment.startsWith('?'));

    return (alert: { actions?: SmartAlertAction[] }): SmartAlertAction[] => {
      if (!alert.actions) {
        return [];
      }

      return alert.actions.filter((action) => {
        // Keep non-navigation actions
        if (!action.route) {
          return true;
        }

        // Filter out if action route is current route
        const isSameRoute = action.route.length === pathSegments.length
          && action.route.every((segment, index) => pathSegments[index] === segment);

        if (isSameRoute) {
          return false;
        }

        // Filter out if action route is parent of current route
        const isParentRoute = action.route.length < pathSegments.length
          && action.route.every((segment, index) => pathSegments[index] === segment);

        if (isParentRoute) {
          return false;
        }

        return true;
      });
    };
  });

  /**
   * Execute alert action
   */
  protected onActionClick(handler: (() => void) | undefined): void {
    if (handler) {
      handler();
    }
  }

  /**
   * Dismiss an alert (and all its duplicates with the same key)
   */
  protected onDismiss(alert: Alert): void {
    // Dispatch single dismiss action - the reducer and effect handle dismissing all duplicates
    this.store$.dispatch(dismissAlertPressed({ id: alert.id }));
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
        return 'mdi-alert-circle';
      case AlertLevel.Warning:
        return 'mdi-alert';
      case AlertLevel.Info:
      case AlertLevel.Notice:
      default:
        return 'mdi-information';
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
   * Check if alert message is long and should be collapsible
   */
  protected isLongMessage(message: string): boolean {
    return message.length > this.maxMessageLength;
  }

  /**
   * Check if alert is currently expanded
   */
  protected isExpanded(alertId: string): boolean {
    return this.expandedAlertIds().has(alertId);
  }

  /**
   * Get truncated message for display
   */
  protected getTruncatedMessage(message: string): string {
    if (message.length <= this.maxMessageLength) {
      return message;
    }
    return message.substring(0, this.maxMessageLength) + '...';
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
   * Check if alert has duplicate instances
   */
  protected hasDuplicates(alert: { duplicateCount?: number }): boolean {
    return (alert.duplicateCount || 0) > 1;
  }

  /**
   * Get duplicate count for alert
   */
  protected getDuplicateCount(alert: { duplicateCount?: number }): number {
    return alert.duplicateCount || 1;
  }
}
