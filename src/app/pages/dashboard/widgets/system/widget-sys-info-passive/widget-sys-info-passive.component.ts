import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import {
  combineLatestWith, filter, map, timer,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { selectUpdateJobForPassiveNode } from 'app/modules/jobs/store/job.selectors';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import {
  getServerProduct, getProductImage, getProductEnclosure, getSystemVersion,
} from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import { AppState } from 'app/store';
import { selectCanFailover, selectIsHaEnabled, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectIsIxHardware, selectIsEnterprise, selectEnclosureSupport, selectIsCertified,
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

  systemInfo = toSignal(this.resources.systemInfo$.pipe(map((sysInfo) => sysInfo.remote_info)));
  updateAvailable = toSignal(this.resources.updateAvailable$);
  isCertified = toSignal(this.store$.select(selectIsCertified));
  isIxHardware = toSignal(this.store$.select(selectIsIxHardware));
  isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  isHaEnabled = toSignal(this.store$.select(selectIsHaEnabled));
  hasEnclosureSupport = toSignal(this.store$.select(selectEnclosureSupport));
  isUpdateRunning = toSignal(this.store$.select(selectUpdateJobForPassiveNode));
  systemUptime = toSignal(this.resources.systemInfo$.pipe(
    map((sysInfo) => sysInfo.remote_info.uptime_seconds),
    combineLatestWith(timer(0, 1000)),
    map(([uptime, interval]) => uptime + interval),
  ));
  systemDatetime = toSignal(this.resources.systemInfo$.pipe(
    map((sysInfo) => sysInfo.remote_info.datetime.$date),
    combineLatestWith(timer(0, 1000)),
    map(([datetime, interval]) => datetime + (interval * 1000)),
  ));

  product = computed(() => {
    return getServerProduct(this.systemInfo()?.system_product);
  });

  productImage = computed(() => {
    return getProductImage(this.systemInfo()?.system_product);
  });

  productEnclosure = computed(() => {
    if (!this.hasEnclosureSupport()) {
      return null;
    }
    return getProductEnclosure(this.systemInfo().system_product);
  });

  isUnsupportedHardware = computed(() => {
    return this.isEnterprise() && !this.productImage() && !this.isIxHardware();
  });

  systemVersion = computed(() => {
    return getSystemVersion(this.systemInfo().version, this.systemInfo()?.codename);
  });

  protected readonly isDisabled$ = this.store$.select(selectCanFailover).pipe(map((canFailover) => !canFailover));
  protected readonly requiredRoles = [Role.FailoverWrite];

  constructor(
    private resources: WidgetResourcesService,
    private dialog: DialogService,
    private store$: Store<AppState>,
    private router: Router,
  ) {}

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

  goToEnclosure(): void {
    if (!this.hasEnclosureSupport()) {
      return;
    }
    this.router.navigate(['/system/oldviewenclosure']);
  }
}
