import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, computed, HostBinding, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTooltipDirective, TnTestIdDirective } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { getProductEnclosure, getProductImageSrc, getServerProduct } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';

@Component({
  selector: 'ix-product-image',
  templateUrl: './product-image.component.html',
  styleUrls: ['./product-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    TnTooltipDirective,
    TnIconComponent,
    NgxSkeletonLoaderModule,
    TranslateModule,
    TnTestIdDirective,
  ],
})
export class ProductImageComponent {
  private router = inject(Router);

  @HostBinding('class.truenas')
  isEnterprise = input.required<boolean>();

  systemProduct = input.required<string>();
  hasEnclosureSupport = input.required<boolean>();
  isHaLicensed = input.required<boolean>();
  isIxHardware = input.required<boolean>();
  showProductImageText = input<boolean>(true);

  /**
   * `product()` is the hardware model, not an instance: an HA dashboard renders this twice for the
   * same model — once per controller — so the model alone does not address one image. Call sites
   * that can appear alongside another pass what tells them apart.
   */
  testIdScope = input('');

  product = computed(() => getServerProduct(this.systemProduct()));
  productImage = computed(() => getProductImageSrc(this.systemProduct()));
  productEnclosure = computed(() => {
    if (!this.hasEnclosureSupport() || !this.systemProduct()) {
      return null;
    }
    return getProductEnclosure(this.systemProduct());
  });

  isUnsupportedHardware = computed(() => {
    const isEnterprise = this.isEnterprise();
    const isIxHardware = this.isIxHardware();
    const isHaLicensed = this.isHaLicensed();
    return isEnterprise && !isIxHardware && !isHaLicensed;
  });

  goToEnclosure(): void {
    if (!this.hasEnclosureSupport()) {
      return;
    }
    this.router.navigate(['/system/viewenclosure']);
  }
}
