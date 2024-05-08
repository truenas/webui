import {
  Component, ChangeDetectionStrategy, input,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ProductEnclosure } from 'app/enums/product-enclosure.enum';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { getProductImage, getServerProduct } from 'app/pages/dashboard/widgets/system/widget-sys-info-local/widget-sys-info.utils';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectEnclosureSupport, selectIsEnterprise, selectIsIxHardware, selectSystemInfo,
} from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-widget-sys-info-local',
  templateUrl: './widget-sys-info-local.component.html',
  styleUrls: ['./widget-sys-info-local.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetSysInfoLocalComponent {
  size = input.required<SlotSize>();

  systemInfo = toSignal(this.store$.select(selectSystemInfo));
  isIxHardware = toSignal(this.store$.select(selectIsIxHardware));
  isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  hasEnclosureSupport = toSignal(this.store$.select(selectEnclosureSupport));
  updateAvailable = toSignal(this.resources.updateAvailable$);

  product = computed(() => {
    if (!this.systemInfo()?.system_product) {
      return '';
    }
    return getServerProduct(this.systemInfo().system_product);
  });

  productImage = computed(() => {
    if (!this.systemInfo()?.system_product) {
      return '';
    }
    return getProductImage(this.systemInfo().system_product);
  });

  productEnclosure = computed(() => {
    if (!this.hasEnclosureSupport()) {
      return null;
    }
    // TODO: Update
    return ProductEnclosure.Rackmount;
  });

  isCertified = computed(() => {
    if (!this.systemInfo()?.system_product) {
      return '';
    }
    return this.systemInfo().system_product.includes('CERTIFIED');
  });

  isUnsupportedHardware = computed(() => {
    return this.isEnterprise() && !this.productImage() && !this.isIxHardware();
  });

  systemVersion = computed(() => {
    if (this.systemInfo()?.codename) {
      this.systemInfo().version.replace('TrueNAS-SCALE', this.systemInfo().codename);
    }
    return this.systemInfo().version;
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
