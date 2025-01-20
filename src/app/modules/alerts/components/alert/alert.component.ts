import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, computed, ElementRef, HostBinding, input, OnChanges,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AlertLevel, alertLevelLabels } from 'app/enums/alert-level.enum';
import { Role } from 'app/enums/role.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { AlertLinkService } from 'app/modules/alerts/services/alert-link.service';
import { alertPanelClosed, dismissAlertPressed, reopenAlertPressed } from 'app/modules/alerts/store/alert.actions';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

const alertIcons = {
  error: iconMarker('error'),
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
  standalone: true,
  imports: [
    IxIconComponent,
    MatTooltip,
    MatButton,
    TestDirective,
    TranslateModule,
    FormatDateTimePipe,
    AsyncPipe,
    RequiresRolesDirective,
  ],
})
export class AlertComponent implements OnChanges, AfterViewInit {
  readonly alert = input.required<Alert>();
  readonly isHaLicensed = input<boolean>();

  @ViewChild('alertMessage', { static: true }) alertMessage: ElementRef<HTMLElement>;

  protected isCollapsed = signal<boolean>(true);
  protected isExpandable = signal<boolean>(false);

  protected readonly requiredRoles = [Role.AlertListWrite];

  alertLevelColor: AlertLevelColor | undefined;
  icon: string;
  iconTooltip: string;

  timezone$ = this.store$.select(selectTimezone);

  @HostBinding('class.dismissed')
  get isDismissed(): boolean {
    return this.alert().dismissed;
  }

  constructor(
    private store$: Store<AppState>,
    private translate: TranslateService,
    protected alertLink: AlertLinkService,
  ) {}

  readonly levelLabel = computed(() => {
    const levelLabel = alertLevelLabels.get(this.alert().level) || this.alert().level;
    return this.translate.instant(levelLabel);
  });

  readonly link = computed(() => this.alertLink.getLink(this.alert().klass));

  ngOnChanges(): void {
    this.setStyles();
  }

  ngAfterViewInit(): void {
    const alertMessageElement = this.alertMessage.nativeElement;
    this.isExpandable.set(alertMessageElement.scrollHeight > alertMessageElement.offsetHeight);
  }

  toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  onDismiss(): void {
    this.store$.dispatch(dismissAlertPressed({ id: this.alert().id }));
  }

  onReopen(): void {
    this.store$.dispatch(reopenAlertPressed({ id: this.alert().id }));
  }

  openLink(): void {
    this.alertLink.openLink(this.alert().klass);
    this.store$.dispatch(alertPanelClosed());
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
