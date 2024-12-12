import { NgClass } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, input,
  computed,
  HostBinding,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { getProductEnclosure, getProductImageSrc, getServerProduct } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';

@Component({
  selector: 'ix-product-image',
  templateUrl: './product-image.component.html',
  styleUrls: ['./product-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgClass,
    MatTooltip,
    IxIconComponent,
    NgxSkeletonLoaderModule,
    TranslateModule,
  ],
})
export class ProductImageComponent {
  @HostBinding('class.ix-logo') get isIxLogo(): boolean {
    return this.productImage().includes('ix-original.svg');
  }

  @HostBinding('class.truenas')
  isEnterprise = input.required<boolean>();

  systemProduct = input.required<string>();
  hasEnclosureSupport = input.required<boolean>();
  isHaLicensed = input.required<boolean>();
  isIxHardware = input.required<boolean>();
  showProductImageText = input<boolean>(true);

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

  constructor(private router: Router) { }

  goToEnclosure(): void {
    if (!this.hasEnclosureSupport()) {
      return;
    }
    this.router.navigate(['/system/viewenclosure']);
  }
}
