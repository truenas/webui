import { AsyncPipe } from '@angular/common';
import { afterNextRender, AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, HostBinding, input, OnChanges, signal, ViewChild, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AlertLevel, alertLevelLabels } from 'app/enums/alert-level.enum';
import { Role } from 'app/enums/role.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert } from 'app/interfaces/smart-alert.interface';
import { SmartAlertService } from 'app/modules/alerts/services/smart-alert.service';
import { alertPanelClosed, dismissAlertPressed, reopenAlertPressed } from 'app/modules/alerts/store/alert.actions';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

const alertIcons = {
  error: iconMarker('mdi-alert-circle'),
  warning: iconMarker('mdi-alert'),
  info: iconMarker('mdi-information'),
  notificationsActive: iconMarker('notifications_active'),
  checkCircle: iconMarker('check_circle'),
  close: iconMarker('clear'),
};

enum AlertLevelColor {
  Warn = 'warn',
  Error = 'error',
  Accent = 'accent',
  Primary = 'primary',
}

@UntilDestroy()
@Component({
  selector: 'ix-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatTooltip,
    MatButton,
    MatIconButton,
    TestDirective,
    TranslateModule,
    FormatDateTimePipe,
    AsyncPipe,
    RequiresRolesDirective,
  ],
})
export class AlertComponent implements OnChanges, AfterViewInit {
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private smartAlertService = inject(SmartAlertService);

  readonly alert = input.required<Alert & { duplicateCount?: number }>();
  readonly isHaLicensed = input<boolean>();
  readonly showActions = input<boolean>(true);

  constructor() {
    // Use afterNextRender to ensure DOM is ready before measuring
    afterNextRender(() => {
      this.checkIfExpandable();
    });
  }

  /**
   * Indicates if this alert has multiple instances (duplicates)
   */
  protected readonly hasDuplicates = computed(() => {
    const count = this.alert().duplicateCount;
    return count !== undefined && count > 1;
  });

  /**
   * The number of duplicate instances of this alert
   */
  protected readonly duplicateCount = computed(() => {
    return this.alert().duplicateCount || 1;
  });

  @ViewChild('alertMessage', { static: true }) alertMessage: ElementRef<HTMLElement>;

  protected isCollapsed = signal<boolean>(true);
  protected isExpandable = signal<boolean>(false);
  protected showContextHelp = signal<boolean>(false);

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
    return this.smartAlertService.enhanceAlert(this.alert());
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
    this.checkIfExpandable();
  }

  ngAfterViewInit(): void {
    this.checkIfExpandable();
  }

  private checkIfExpandable(): void {
    const alertMessageElement = this.alertMessage?.nativeElement;
    if (!alertMessageElement) {
      return;
    }
    // Use setTimeout to ensure CSS (line-clamp) has been fully applied before measuring
    setTimeout(() => {
      this.isExpandable.set(alertMessageElement.scrollHeight > alertMessageElement.offsetHeight);
    }, 0);
  }

  toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  toggleContextHelp(): void {
    this.showContextHelp.set(!this.showContextHelp());
  }

  onDismiss(): void {
    this.store$.dispatch(dismissAlertPressed({ id: this.alert().id }));
  }

  onReopen(): void {
    this.store$.dispatch(reopenAlertPressed({ id: this.alert().id }));
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
