import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
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
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

enum AlertIcon {
  Error = 'cancel',
  Warning = 'error',
  Info = 'info',
  NotificationsActive = 'notifications_active',
  CheckCircle = 'check_circle',
}

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
  @Input() alert: Alert;
  @Input() isHaLicensed: boolean;

  alertLevelColor: AlertLevelColor;
  icon: string;
  iconTooltip: string;
  timezone: string;

  timezone$ = this.store$.select(selectTimezone);

  @HostBinding('class.dismissed')
  get isDismissed(): boolean {
    return this.alert.dismissed;
  }

  constructor(
    private store$: Store<AppState>,
    private translate: TranslateService,
  ) {}

  get alertLevelLabel(): string {
    return this.translate.instant(alertLevelLabels.get(this.alert.level));
  }

  ngOnChanges(): void {
    this.setStyles();
  }

  onDismiss(): void {
    this.store$.dispatch(dismissAlertPressed({ id: this.alert.id }));
  }

  onReopen(): void {
    this.store$.dispatch(reopenAlertPressed({ id: this.alert.id }));
  }

  private setStyles(): void {
    switch (true) {
      case this.alert.dismissed:
        this.alertLevelColor = undefined;
        this.icon = AlertIcon.CheckCircle;
        this.iconTooltip = this.translate.instant('Dismissed');
        break;
      case [AlertLevel.Error, AlertLevel.Critical].includes(this.alert.level):
        this.alertLevelColor = AlertLevelColor.Error;
        this.icon = AlertIcon.Error;
        break;
      case this.alert.level === AlertLevel.Warning:
        this.alertLevelColor = AlertLevelColor.Warn;
        this.icon = AlertIcon.Warning;
        break;
      case this.alert.one_shot:
        this.icon = AlertIcon.NotificationsActive;
        this.iconTooltip = this.translate.instant(
          "This is a ONE-SHOT {alertLevel} alert, it won't be dismissed automatically",
          { alertLevel: this.alertLevelLabel },
        );
        this.alertLevelColor = AlertLevelColor.Primary;
        break;
      default:
        this.alertLevelColor = AlertLevelColor.Primary;
        this.icon = AlertIcon.Info;
    }
  }
}
