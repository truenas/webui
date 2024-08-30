import {
  ChangeDetectionStrategy, Component, computed, effect, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import {
  filter, map,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { selectUpdateJobForPassiveNode } from 'app/modules/jobs/store/job.selectors';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { getSystemVersion } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import { LocaleService } from 'app/services/locale.service';
import { AppsState } from 'app/store';
import { selectCanFailover, selectIsHaEnabled, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectIsIxHardware, selectIsEnterprise, selectHasEnclosureSupport,
} from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-widget-sys-info-passive',
  templateUrl: './widget-sys-info-passive.component.html',
  styleUrls: ['../common/widget-sys-info.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetSysInfoPassiveComponent {
  size = input.required<SlotSize>();

  protected readonly requiredRoles = [Role.FailoverWrite];

  canFailover = toSignal(this.store$.select(selectCanFailover));
  isIxHardware = toSignal(this.store$.select(selectIsIxHardware));
  isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  isHaEnabled = toSignal(this.store$.select(selectIsHaEnabled));
  hasEnclosureSupport = toSignal(this.store$.select(selectHasEnclosureSupport));
  isUpdateRunning = toSignal(this.store$.select(selectUpdateJobForPassiveNode));

  updateAvailable = toSignal(this.resources.updateAvailable$);
  systemInfo = toSignal(this.resources.systemInfo$.pipe(
    filter((state) => !state.isLoading),
    map((state) => state.value.remote_info),
  ));

  startTime = Date.now();

  realElapsedSeconds = toSignal(this.resources.refreshInterval$.pipe(
    map(() => {
      return Math.floor((Date.now() - this.startTime) / 1000);
    }),
  ));

  isWaitingForEnabledHa = computed(() => !this.systemInfo() && !this.canFailover() && !this.isHaEnabled());
  version = computed(() => getSystemVersion(this.systemInfo().version, this.systemInfo().codename));
  uptime = computed(() => this.systemInfo().uptime_seconds + this.realElapsedSeconds());
  datetime = computed(() => {
    const [dateValue, timeValue] = this.localeService.getDateAndTime();
    const extractedDate = this.localeService.getDateFromString(`${dateValue} ${timeValue}`, this.systemInfo().timezone);

    return extractedDate.getTime() + (this.realElapsedSeconds() * 1000);
  });
  isLoaded = computed(() => this.systemInfo());

  constructor(
    private resources: WidgetResourcesService,
    private dialog: DialogService,
    private store$: Store<AppsState>,
    private router: Router,
    private localeService: LocaleService,
  ) {
    effect(() => {
      if (!this.systemInfo() && this.canFailover()) {
        this.resources.refreshSystemInfo();
      }
    });
  }

  openDialog(): void {
    this.dialog.confirm({
      title: helptextSystemFailover.dialog_initiate_failover_title,
      message: helptextSystemFailover.dialog_initiate_failover_message,
      buttonText: helptextSystemFailover.dialog_initiate_action,
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/others/failover'], { skipLocationChange: true });
    });
  }
}
