import {
  ChangeDetectionStrategy,
  Component, computed,
  HostBinding, input,
  OnChanges,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AlertLevel, alertLevelLabels } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import {
  dismissAlertPressed,
  reopenAlertPressed,
} from 'app/modules/alerts/store/alert.actions';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AppsState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

const alertIcons = {
  error: iconMarker('cancel'),
  warning: iconMarker('error'),
  info: iconMarker('info'),
  notificationsActive: iconMarker('notifications_active'),
  checkCircle: iconMarker('check_circle'),
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
})
export class AlertComponent implements OnChanges {
  readonly alert = input.required<Alert>();
  readonly isHaLicensed = input<boolean>();

  alertLevelColor: AlertLevelColor;
  icon: string;
  iconTooltip: string;
  timezone: string;

  timezone$ = this.store$.select(selectTimezone);

  @HostBinding('class.dismissed')
  get isDismissed(): boolean {
    return this.alert().dismissed;
  }

  constructor(
    private store$: Store<AppsState>,
    private translate: TranslateService,
  ) {}

  readonly levelLabel = computed(() => this.translate.instant(alertLevelLabels.get(this.alert().level)));

  ngOnChanges(): void {
    this.setStyles();
  }

  onDismiss(): void {
    this.store$.dispatch(dismissAlertPressed({ id: this.alert().id }));
  }

  onReopen(): void {
    this.store$.dispatch(reopenAlertPressed({ id: this.alert().id }));
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
