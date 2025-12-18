import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatRipple } from '@angular/material/core';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { NavigateAndHighlightDirective } from 'app/directives/navigate-and-interact/navigate-and-highlight.directive';
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
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
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
    NavigateAndHighlightDirective,
    MatProgressBar,
    AlertComponent,
    MatRipple,
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

  protected readonly requiredRoles = [Role.AlertListWrite];

  error$ = this.store$.select(selectAlertState).pipe(map((state) => state.error));
  isLoading$ = this.store$.select(selectAlertState).pipe(map((state) => state.isLoading));

  private readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = false;

  // Group by category toggle
  protected groupByCategory = signal(true);

  // Severity filter
  protected severityFilter = signal<'all' | 'critical' | 'warning' | 'info'>('all');

  // Convert observables to signals for enhanced alerts
  private unreadAlertsSignal = toSignal(this.store$.select(selectUnreadAlerts), { initialValue: [] });
  private dismissedAlertsSignal = toSignal(this.store$.select(selectDismissedAlerts), { initialValue: [] });

  // Enhance alerts with smart actions
  private allEnhancedUnreadAlerts = computed<(Alert & EnhancedAlert)[]>(() => {
    return this.unreadAlertsSignal().map((alert) => this.smartAlertService.enhanceAlert(alert));
  });

  private allEnhancedDismissedAlerts = computed<(Alert & EnhancedAlert)[]>(() => {
    return this.dismissedAlertsSignal().map((alert) => this.smartAlertService.enhanceAlert(alert));
  });

  // Filtered alerts based on severity
  protected enhancedUnreadAlerts = computed<(Alert & EnhancedAlert)[]>(() => {
    const alerts = this.allEnhancedUnreadAlerts();
    return this.filterBySeverity(alerts);
  });

  protected enhancedDismissedAlerts = computed<(Alert & EnhancedAlert)[]>(() => {
    const alerts = this.allEnhancedDismissedAlerts();
    return this.filterBySeverity(alerts);
  });

  // Counts for filter buttons (only unread/active alerts)
  protected alertCounts = computed(() => {
    const alerts = this.allEnhancedUnreadAlerts().filter((alert) => !alert.dismissed);
    return {
      all: alerts.length,
      critical: alerts.filter((a) => this.isCritical(a.level)).length,
      warning: alerts.filter((a) => this.isWarning(a.level)).length,
      info: alerts.filter((a) => this.isInfo(a.level)).length,
    };
  });

  // Group alerts by category
  protected groupedUnreadAlerts = computed(() => {
    if (!this.groupByCategory()) {
      return null;
    }
    return this.smartAlertService.groupAlertsByCategory(this.enhancedUnreadAlerts());
  });

  protected groupedDismissedAlerts = computed(() => {
    if (!this.groupByCategory()) {
      return null;
    }
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
    [SmartAlertCategory.Storage]: 'dns',
    [SmartAlertCategory.Network]: 'mdi-network',
    [SmartAlertCategory.Services]: 'settings',
    [SmartAlertCategory.System]: 'settings',
    [SmartAlertCategory.Security]: 'vpn_key',
    [SmartAlertCategory.Hardware]: 'mdi-server',
    [SmartAlertCategory.Tasks]: 'security',
    [SmartAlertCategory.Applications]: 'apps',
  };

  ngOnInit(): void {
    this.checkHaStatus();
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

  toggleGroupByCategory(): void {
    this.groupByCategory.set(!this.groupByCategory());
  }

  setSeverityFilter(filter: 'all' | 'critical' | 'warning' | 'info'): void {
    this.severityFilter.set(filter);
  }

  private filterBySeverity(alerts: (Alert & EnhancedAlert)[]): (Alert & EnhancedAlert)[] {
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

  closePanel(): void {
    this.store$.dispatch(alertPanelClosed());
  }

  /**
   * Helper to convert Map entries to array for template iteration
   * Sorts categories with uncategorized items appearing last
   */
  getCategoryEntries(
    categoryMap: Map<string, (Alert & EnhancedAlert)[]> | null,
  ): [string, (Alert & EnhancedAlert)[]][] {
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
    return this.categoryIcons[category as SmartAlertCategory] || 'mdi-alert-circle';
  }

  // Helper to get category label
  getCategoryLabel(category: string): string {
    return this.categoryLabels[category as SmartAlertCategory] || category;
  }

  private checkHaStatus(): void {
    if (!this.isEnterprise()) {
      return;
    }

    this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
      this.isHaLicensed = isHaLicensed;
      this.cdr.markForCheck();
    });
  }
}
