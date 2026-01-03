import { AsyncPipe } from '@angular/common';
import { DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Role } from 'app/enums/role.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert, SmartAlertCategory } from 'app/interfaces/smart-alert.interface';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { SmartAlertService } from 'app/modules/alerts/services/smart-alert.service';
import {
  alertPanelClosed,
  dismissAllAlertsPressed,
  reopenAllAlertsPressed,
} from 'app/modules/alerts/store/alert.actions';
import {
  selectAlertState,
  selectDismissedAlerts,
  selectUnreadAlerts,
} from 'app/modules/alerts/store/alert.selectors';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { EmailFormComponent } from 'app/pages/system/general-settings/email/email-form/email-form.component';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

/**
 * Extended alert with duplicate count information
 */
type AlertWithDuplicates = Alert & EnhancedAlert & { duplicateCount: number };

@Component({
  selector: 'ix-alerts-panel',
  templateUrl: './alerts-panel.component.html',
  styleUrls: ['./alerts-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    TestDirective,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    MatProgressBar,
    AlertComponent,
    TranslateModule,
    AsyncPipe,
    RequiresRolesDirective,
  ],
})
export class AlertsPanelComponent implements OnInit {
  private store$ = inject<Store<AppState>>(Store);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private smartAlertService = inject(SmartAlertService);
  private destroyRef = inject(DestroyRef);
  private slideIn = inject(SlideIn);

  protected readonly requiredRoles = [Role.AlertListWrite];

  error$ = this.store$.select(selectAlertState).pipe(map((state) => state.error));
  isLoading$ = this.store$.select(selectAlertState).pipe(map((state) => state.isLoading));

  private readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = false;

  // Static icons
  protected readonly settingsIcon = iconMarker('settings');
  protected readonly clearIcon = iconMarker('clear');
  protected readonly cancelIcon = iconMarker('cancel');
  protected readonly infoIcon = iconMarker('info');
  protected readonly bellIcon = iconMarker('notifications_none');

  // Severity filter
  protected severityFilter = signal<'all' | 'critical' | 'warning' | 'info' | 'dismissed'>('all');

  // Convert observables to signals for enhanced alerts
  private unreadAlertsSignal = toSignal(this.store$.select(selectUnreadAlerts), { initialValue: [] });
  private dismissedAlertsSignal = toSignal(this.store$.select(selectDismissedAlerts), { initialValue: [] });

  // Enhance alerts with smart actions and add duplicate counts
  private allEnhancedUnreadAlerts = computed<AlertWithDuplicates[]>(() => {
    const alerts = this.unreadAlertsSignal().map((alert) => this.smartAlertService.enhanceAlert(alert));
    return this.addDuplicateCounts(alerts);
  });

  private allEnhancedDismissedAlerts = computed<AlertWithDuplicates[]>(() => {
    const alerts = this.dismissedAlertsSignal().map((alert) => this.smartAlertService.enhanceAlert(alert));
    return this.addDuplicateCounts(alerts);
  });

  // Filtered alerts based on severity
  protected enhancedUnreadAlerts = computed<AlertWithDuplicates[]>(() => {
    const alerts = this.allEnhancedUnreadAlerts();
    return this.filterBySeverity(alerts);
  });

  protected enhancedDismissedAlerts = computed<AlertWithDuplicates[]>(() => {
    const alerts = this.allEnhancedDismissedAlerts();
    return this.filterBySeverity(alerts);
  });

  // Counts for filter buttons
  protected alertCounts = computed(() => {
    const unreadAlerts = this.allEnhancedUnreadAlerts();
    const dismissedAlerts = this.allEnhancedDismissedAlerts();
    return {
      all: unreadAlerts.length,
      critical: unreadAlerts.filter((a) => this.isCritical(a.level)).length,
      warning: unreadAlerts.filter((a) => this.isWarning(a.level)).length,
      info: unreadAlerts.filter((a) => this.isInfo(a.level)).length,
      dismissed: dismissedAlerts.length,
    };
  });

  // Group alerts by category (always enabled)
  protected groupedUnreadAlerts = computed(() => {
    return this.smartAlertService.groupAlertsByCategory(this.enhancedUnreadAlerts());
  });

  protected groupedDismissedAlerts = computed(() => {
    return this.smartAlertService.groupAlertsByCategory(this.enhancedDismissedAlerts());
  });

  // Category labels for display
  protected readonly categoryLabels: Record<SmartAlertCategory, string> = {
    [SmartAlertCategory.Storage]: 'Storage',
    [SmartAlertCategory.Network]: 'Network',
    [SmartAlertCategory.Services]: 'Services',
    [SmartAlertCategory.System]: 'System',
    [SmartAlertCategory.Security]: 'Security',
    [SmartAlertCategory.Hardware]: 'Hardware',
    [SmartAlertCategory.Tasks]: 'Tasks',
    [SmartAlertCategory.Applications]: 'Applications',
  };

  // Category icons for display - matching side navigation icons
  protected readonly categoryIcons: Record<SmartAlertCategory, string> = {
    [SmartAlertCategory.Storage]: iconMarker('dns'),
    [SmartAlertCategory.Network]: iconMarker('mdi-network'),
    [SmartAlertCategory.Services]: iconMarker('settings'),
    [SmartAlertCategory.System]: iconMarker('settings'),
    [SmartAlertCategory.Security]: iconMarker('vpn_key'),
    [SmartAlertCategory.Hardware]: iconMarker('mdi-server'),
    [SmartAlertCategory.Tasks]: iconMarker('security'),
    [SmartAlertCategory.Applications]: iconMarker('apps'),
  };

  ngOnInit(): void {
    this.checkHaStatus();
  }

  /**
   * Adds duplicate count to each alert.
   * Counts how many alerts share the same key (duplicate instances).
   */
  private addDuplicateCounts<T extends Alert>(alerts: T[]): (T & { duplicateCount: number })[] {
    // Count alerts by key
    const keyCounts = new Map<string, number>();
    alerts.forEach((alert) => {
      keyCounts.set(alert.key, (keyCounts.get(alert.key) || 0) + 1);
    });

    // Add duplicate count to each alert
    return alerts.map((alert) => ({
      ...alert,
      duplicateCount: keyCounts.get(alert.key) || 1,
    }));
  }

  onPanelClosed(): void {
    this.store$.dispatch(alertPanelClosed());
  }

  onReopenAll(): void {
    this.store$.dispatch(reopenAllAlertsPressed());
  }

  onDismissAll(): void {
    this.store$.dispatch(dismissAllAlertsPressed());
  }

  setSeverityFilter(filter: 'all' | 'critical' | 'warning' | 'info' | 'dismissed'): void {
    this.severityFilter.set(filter);
  }

  /**
   * Check if we should show dismissed alerts section
   */
  protected shouldShowDismissed = computed(() => {
    return this.severityFilter() === 'dismissed';
  });

  /**
   * Check if we should show unread alerts section
   */
  protected shouldShowUnread = computed(() => {
    return this.severityFilter() !== 'dismissed';
  });

  private filterBySeverity<T extends Alert & EnhancedAlert>(alerts: T[]): T[] {
    const filter = this.severityFilter();
    if (filter === 'all') {
      return alerts;
    }
    if (filter === 'critical') {
      return alerts.filter((a) => this.isCritical(a.level));
    }
    if (filter === 'warning') {
      return alerts.filter((a) => this.isWarning(a.level));
    }
    if (filter === 'info') {
      return alerts.filter((a) => this.isInfo(a.level));
    }
    return alerts;
  }

  private isCritical(level: AlertLevel): boolean {
    return [
      AlertLevel.Critical,
      AlertLevel.Alert,
      AlertLevel.Emergency,
      AlertLevel.Error,
    ].includes(level);
  }

  private isWarning(level: AlertLevel): boolean {
    return level === AlertLevel.Warning;
  }

  private isInfo(level: AlertLevel): boolean {
    return [AlertLevel.Info, AlertLevel.Notice].includes(level);
  }

  navigateTo(route: string[], extras?: NavigationExtras): void {
    this.closePanel();
    this.router.navigate(route, extras);
  }

  openEmailForm(): void {
    this.closePanel();
    this.slideIn.open(EmailFormComponent, { data: undefined });
  }

  closePanel(): void {
    this.store$.dispatch(alertPanelClosed());
  }

  /**
   * Helper to convert Map entries to array for template iteration
   * Sorts categories with uncategorized items appearing last
   */
  getCategoryEntries(
    categoryMap: Map<string, AlertWithDuplicates[]> | null,
  ): [string, AlertWithDuplicates[]][] {
    if (!categoryMap) return [];

    const knownCategories = Object.values(SmartAlertCategory);

    return Array.from(categoryMap.entries()).sort((a, b) => {
      const aIsKnown = knownCategories.includes(a[0] as SmartAlertCategory);
      const bIsKnown = knownCategories.includes(b[0] as SmartAlertCategory);

      // Push unknown categories (like 'Uncategorized') to the end
      if (!aIsKnown && bIsKnown) return 1;
      if (aIsKnown && !bIsKnown) return -1;
      // Keep other categories in their original order
      return 0;
    });
  }

  // Helper to get category icon
  getCategoryIcon(category: string): string {
    return this.categoryIcons[category as SmartAlertCategory] || iconMarker('mdi-alert-circle');
  }

  // Helper to get category label
  getCategoryLabel(category: string): string {
    return this.categoryLabels[category as SmartAlertCategory] || category;
  }

  private checkHaStatus(): void {
    if (!this.isEnterprise()) {
      return;
    }

    this.store$.select(selectIsHaLicensed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isHaLicensed) => {
        this.isHaLicensed = isHaLicensed;
        this.cdr.markForCheck();
      });
  }
}
