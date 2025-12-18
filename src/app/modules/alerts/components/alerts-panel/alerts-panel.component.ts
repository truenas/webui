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

  // Convert observables to signals for enhanced alerts
  private unreadAlertsSignal = toSignal(this.store$.select(selectUnreadAlerts), { initialValue: [] });
  private dismissedAlertsSignal = toSignal(this.store$.select(selectDismissedAlerts), { initialValue: [] });

  // Enhance alerts with smart actions
  protected enhancedUnreadAlerts = computed<(Alert & EnhancedAlert)[]>(() => {
    return this.unreadAlertsSignal().map((alert) => this.smartAlertService.enhanceAlert(alert));
  });

  protected enhancedDismissedAlerts = computed<(Alert & EnhancedAlert)[]>(() => {
    return this.dismissedAlertsSignal().map((alert) => this.smartAlertService.enhanceAlert(alert));
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

  // Category icons for display
  protected readonly categoryIcons: Record<SmartAlertCategory, string> = {
    [SmartAlertCategory.Storage]: 'mdi-database',
    [SmartAlertCategory.Network]: 'mdi-network',
    [SmartAlertCategory.Services]: 'mdi-cog',
    [SmartAlertCategory.System]: 'mdi-server',
    [SmartAlertCategory.Security]: 'mdi-shield-check',
    [SmartAlertCategory.Hardware]: 'mdi-chip',
    [SmartAlertCategory.Tasks]: 'mdi-clipboard-check',
    [SmartAlertCategory.Applications]: 'mdi-application',
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

  navigateTo(route: string[], extras?: NavigationExtras): void {
    this.closePanel();
    this.router.navigate(route, extras);
  }

  closePanel(): void {
    this.store$.dispatch(alertPanelClosed());
  }

  // Helper to convert Map entries to array for template iteration
  getCategoryEntries(
    categoryMap: Map<string, (Alert & EnhancedAlert)[]> | null,
  ): [string, (Alert & EnhancedAlert)[]][] {
    if (!categoryMap) return [];
    return Array.from(categoryMap.entries());
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
