import {
  Component, ChangeDetectionStrategy, input,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  combineLatestWith, map, timer,
} from 'rxjs';
import { selectUpdateJobForActiveNode } from 'app/modules/jobs/store/job.selectors';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import {
  getServerProduct, getProductImage, getProductEnclosure, getSystemVersion,
} from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectEnclosureSupport, selectIsCertified, selectIsEnterprise, selectIsIxHardware,
} from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-widget-sys-info-active',
  templateUrl: './widget-sys-info-active.component.html',
  styleUrls: ['../common/widget-sys-info.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetSysInfoActiveComponent {
  size = input.required<SlotSize>();

  private readonly systemInfo$ = this.resources.systemInfo$;

  isIxHardware = toSignal(this.store$.select(selectIsIxHardware));
  isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  isCertified = toSignal(this.store$.select(selectIsCertified));
  hasEnclosureSupport = toSignal(this.store$.select(selectEnclosureSupport));
  isUpdateRunning = toSignal(this.store$.select(selectUpdateJobForActiveNode));
  updateAvailable = toSignal(this.resources.updateAvailable$);
  systemInfo = toSignal(this.resources.systemInfo$);
  version = toSignal(this.systemInfo$.pipe(map((sysInfo) => getSystemVersion(sysInfo.version, sysInfo.codename))));
  hardwareProduct = toSignal(this.systemInfo$.pipe(map((sysInfo) => getServerProduct(sysInfo.system_product))));
  productImage = toSignal(this.systemInfo$.pipe(map((sysInfo) => getProductImage(sysInfo.system_product))));
  systemUptime = toSignal(this.systemInfo$.pipe(
    map((sysInfo) => sysInfo.uptime_seconds),
    combineLatestWith(timer(0, 1000)),
    map(([uptime, interval]) => uptime + interval),
  ));
  systemDatetime = toSignal(this.systemInfo$.pipe(
    map((sysInfo) => sysInfo.datetime.$date),
    combineLatestWith(timer(0, 1000)),
    map(([datetime, interval]) => datetime + (interval * 1000)),
  ));

  isLoaded = computed(() => {
    return this.systemInfo();
  });

  platform = computed(() => {
    if (this.systemInfo()?.platform && this.isIxHardware()) {
      return this.systemInfo().platform;
    }
    return 'Generic';
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

  constructor(
    private resources: WidgetResourcesService,
    private store$: Store<AppState>,
    private router: Router,
  ) {}

  goToEnclosure(): void {
    if (!this.hasEnclosureSupport()) {
      return;
    }
    this.router.navigate(['/system/oldviewenclosure']);
  }
}
