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

    // De-duplicate alerts by formatted message (for HA setups where same alert comes from multiple nodes)
    // In HA environments, the same alert message can appear multiple times from different controllers
    const uniqueAlertsMap = new Map<string, Alert & EnhancedAlert>();
    filteredAlerts.forEach((alert) => {
      // Use normalized formatted message as the deduplication key (trim whitespace and normalize line breaks)
      const dedupeKey = (alert.formatted || alert.text).trim().replace(/\s+/g, ' ');
      const existing = uniqueAlertsMap.get(dedupeKey);

      // Keep the most recent alert
      if (!existing || (alert.datetime?.$date || 0) > (existing.datetime?.$date || 0)) {
        uniqueAlertsMap.set(dedupeKey, alert);
      }
    });

    return Array.from(uniqueAlertsMap.values());
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
   * Dismiss an alert
   */
  protected onDismiss(alert: Alert): void {
    this.store$.dispatch(dismissAlertPressed({ id: alert.uuid }));
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
}
