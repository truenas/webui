import {
  Component, ChangeDetectionStrategy, input,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
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

  isIxHardware = toSignal(this.store$.select(selectIsIxHardware));
  isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  isCertified = toSignal(this.store$.select(selectIsCertified));
  hasEnclosureSupport = toSignal(this.store$.select(selectEnclosureSupport));
  isUpdateRunning = toSignal(this.store$.select(selectUpdateJobForActiveNode));
  updateAvailable = toSignal(this.resources.updateAvailable$);
  systemInfo = toSignal(this.resources.systemInfo$);

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

  systemPlatform = computed(() => {
    if (this.systemInfo().platform && this.isIxHardware()) {
      return this.systemInfo().platform;
    }
    return 'Generic';
  });

  // TODO: Fix uptime counter

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
