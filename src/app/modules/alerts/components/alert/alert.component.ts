import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, HostBinding, input, OnChanges, signal, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  tnIconMarker, TnIconButtonComponent, TnIconComponent, TnTestIdDirective, TnTooltipDirective,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AlertLevel, alertLevelLabels } from 'app/enums/alert-level.enum';
import { Role } from 'app/enums/role.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { AlertWithDuplicates, EnhancedAlert } from 'app/interfaces/smart-alert.interface';
import { SmartAlertService } from 'app/modules/alerts/services/smart-alert.service';
import { alertPanelClosed, dismissAlertPressed, reopenAlertPressed } from 'app/modules/alerts/store/alert.actions';
import { getAlertSummary, hasAlertDetails } from 'app/modules/alerts/utils/alert-summary.utils';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

const alertIcons = {
  error: tnIconMarker('alert-circle', 'mdi'),
  warning: tnIconMarker('alert', 'mdi'),
  info: tnIconMarker('information', 'mdi'),
  notificationsActive: tnIconMarker('bell-ring', 'mdi'),
  checkCircle: tnIconMarker('check-circle', 'mdi'),
  close: tnIconMarker('close', 'mdi'),
};

enum AlertLevelColor {
  Warn = 'warn',
  Error = 'error',
  Accent = 'accent',
  Primary = 'primary',
}

@Component({
  selector: 'ix-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TnIconButtonComponent,
    TnTooltipDirective,
    TnTestIdDirective,
    TranslateModule,
    FormatDateTimePipe,
    AsyncPipe,
    RequiresRolesDirective,
  ],
})
export class AlertComponent implements OnChanges {
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private smartAlertService = inject(SmartAlertService);

  readonly alert = input.required<AlertWithDuplicates>();
  readonly isHaLicensed = input<boolean>();
  readonly showActions = input<boolean>(true);

  protected readonly hasDuplicates = computed(() => this.alert().duplicateCount > 1);

  protected readonly duplicateCount = computed(() => this.alert().duplicateCount);

  protected isCollapsed = signal<boolean>(true);
  protected showContextHelp = signal<boolean>(false);

  /**
   * Concise headline: the group summary when this row consolidates several alerts,
   * otherwise the first sentence of the alert's own message.
   */
  protected readonly summary = computed(() => {
    const groupSummary = this.enhancedAlert().groupSummary;
    if (this.hasDuplicates() && groupSummary) {
      return this.translate.instant(groupSummary, { count: this.duplicateCount() });
    }
    return getAlertSummary(this.alert().formatted);
  });

  /** Full messages revealed by "View More", one per consolidated alert. */
  protected readonly detailMessages = computed(() => {
    return this.alert().groupedMessages ?? [this.alert().formatted];
  });

  protected readonly isExpandable = computed(() => {
    return this.hasDuplicates() || hasAlertDetails(this.alert().formatted);
  });

  protected readonly requiredRoles = [Role.AlertListWrite];
  protected readonly closeIcon = alertIcons.close;

  alertLevelColor: AlertLevelColor | undefined;
  icon: string;
  iconTooltip: string;

  timezone$ = this.store$.select(selectTimezone);

  @HostBinding('class.dismissed')
  get isDismissed(): boolean {
    return this.alert().dismissed;
  }

  readonly levelLabel = computed(() => {
    const levelLabel = alertLevelLabels.get(this.alert().level) || this.alert().level;
    return this.translate.instant(levelLabel);
  });

  readonly enhancedAlert = computed<Alert & EnhancedAlert>(() => {
    return this.smartAlertService.enhanceAlert(this.alert(), { isConsolidated: this.hasDuplicates() });
  });

  protected readonly dismissButtonText = computed(() => {
    if (this.hasDuplicates()) {
      return this.translate.instant('Dismiss All ({count})', { count: this.duplicateCount() });
    }
    return this.translate.instant('Dismiss');
  });

  protected readonly dismissTooltip = computed(() => {
    if (this.hasDuplicates()) {
      return this.translate.instant('Dismiss all {count} instances', { count: this.duplicateCount() });
    }
    return undefined;
  });

  protected readonly duplicateCountTooltip = computed(() => {
    return this.translate.instant('{count} instances of this alert', { count: this.duplicateCount() });
  });

  ngOnChanges(): void {
    this.setStyles();
  }

  toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  toggleContextHelp(): void {
    this.showContextHelp.set(!this.showContextHelp());
  }

  onDismiss(): void {
    this.store$.dispatch(dismissAlertPressed({ ids: this.alert().allIds }));
  }

  onReopen(): void {
    this.store$.dispatch(reopenAlertPressed({ ids: this.alert().allIds }));
  }

  onSmartActionClick(handler: (() => void) | undefined): void {
    if (handler) {
      handler();
      this.store$.dispatch(alertPanelClosed());
    }
  }

  private setStyles(): void {
    switch (true) {
      case this.alert().dismissed:
        this.alertLevelColor = undefined;
        this.icon = alertIcons.checkCircle;
        this.iconTooltip = this.translate.instant('Dismissed');
        break;
      case [AlertLevel.Error, AlertLevel.Critical].includes(this.alert().level):
        this.alertLevelColor = AlertLevelColor.Error;
        this.icon = alertIcons.error;
        break;
      case this.alert().level === AlertLevel.Warning:
        this.alertLevelColor = AlertLevelColor.Warn;
        this.icon = alertIcons.warning;
        break;
      case this.alert().one_shot:
        this.icon = alertIcons.notificationsActive;
        this.iconTooltip = this.translate.instant(
          "This is a ONE-SHOT {alertLevel} alert, it won't be dismissed automatically",
          { alertLevel: this.levelLabel() },
        );
        this.alertLevelColor = AlertLevelColor.Primary;
        break;
      default:
        this.alertLevelColor = AlertLevelColor.Primary;
        this.icon = alertIcons.info;
    }
  }
}
