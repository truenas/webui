import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert } from 'app/interfaces/smart-alert.interface';
import { selectAlertsForNavBadges } from 'app/modules/alerts/store/alert.selectors';
import { AppState } from 'app/store';
import { SmartAlertService } from './smart-alert.service';

export interface NavBadge {
  critical: number;
  warning: number;
  info: number;
}

/**
 * Service for integrating smart alerts with navigation badges
 *
 * Usage in navigation components:
 *
 * ```typescript
 * export class NavigationComponent {
 *   private navBadgeService = inject(AlertNavBadgeService);
 *
 *   // Get badge counts as a signal
 *   badgeCounts = this.navBadgeService.getBadgeCountsSignal();
 *
 *   // Check if a menu path has alerts
 *   hasAlerts(path: string[]): boolean {
 *     const counts = this.badgeCounts().get(path.join('.'));
 *     return counts && (counts.critical > 0 || counts.warning > 0);
 *   }
 *
 *   // Get badge count for display
 *   getBadgeCount(path: string[]): number {
 *     const counts = this.badgeCounts().get(path.join('.'));
 *     return counts ? counts.critical + counts.warning : 0;
 *   }
 * }
 * ```
 *
 * Example menu paths from the registry:
 * - ['system', 'general', 'support'] - License alerts
 * - ['storage'] - Storage/pool alerts
 * - ['network'] - Network alerts
 * - ['services'] - Service alerts
 * - ['credentials', 'certificates'] - Certificate alerts
 */
@Injectable({
  providedIn: 'root',
})
export class AlertNavBadgeService {
  private store$ = inject<Store<AppState>>(Store);
  private smartAlertService = inject(SmartAlertService);

  private alertsSignal = toSignal(
    this.store$.select(selectAlertsForNavBadges),
    { initialValue: [] },
  );

  /**
   * Returns a signal of Map<string, NavBadge> where keys are menu paths (joined with '.')
   */
  getBadgeCountsSignal(): Signal<Map<string, NavBadge>> {
    return computed(() => {
      const alerts = this.alertsSignal();
      const enhancedAlerts = alerts.map((alert) => this.smartAlertService.enhanceAlert(alert));
      return this.smartAlertService.getAlertCountsByMenuPath(enhancedAlerts);
    });
  }

  /**
   * Get badge count for a specific menu path
   */
  getBadgeCountForPath(path: string[], badgeCounts: Map<string, NavBadge>): number {
    const key = path.join('.');
    const counts = badgeCounts.get(key);
    return counts ? counts.critical + counts.warning + counts.info : 0;
  }

  /**
   * Check if a menu path has critical alerts
   */
  hasCriticalAlerts(path: string[], badgeCounts: Map<string, NavBadge>): boolean {
    const key = path.join('.');
    const counts = badgeCounts.get(key);
    return counts ? counts.critical > 0 : false;
  }

  /**
   * Get all enhanced alerts
   */
  getEnhancedAlerts(): Signal<(Alert & EnhancedAlert)[]> {
    return computed(() => {
      const alerts = this.alertsSignal();
      return alerts.map((alert) => this.smartAlertService.enhanceAlert(alert));
    });
  }
}
