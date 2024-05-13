import {
  Component, ChangeDetectionStrategy, input,
  computed,
  HostBinding,
} from '@angular/core';
import { Router } from '@angular/router';
import { getProductEnclosure, getProductImage, getServerProduct } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';

@Component({
  selector: 'ix-product-image',
  templateUrl: './product-image.component.html',
  styleUrls: ['./product-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductImageComponent {
  @HostBinding('class.ix-logo') get isIxLogo(): boolean {
    return this.productImage() === 'ix-original.svg';
  }
  @HostBinding('class.truenas')
  isEnterprise = input.required<boolean>();
  systemProduct = input.required<string>();
  hasEnclosureSupport = input.required<boolean>();
  isHaLicensed = input.required<boolean>();
  isIxHardware = input.required<boolean>();

  isCertified = computed(() => this.systemProduct()?.includes('CERTIFIED'));
  product = computed(() => getServerProduct(this.systemProduct()));
  productImage = computed(() => getProductImage(this.systemProduct()));
  productImageSrc = computed(() => {
    if (!this.productImage() || !this.isIxHardware()) {
      return 'assets/images/truenas_scale_ondark_favicon.png';
    }
    return 'assets/images' + (this.productImage().startsWith('/') ? this.productImage() : ('/' + this.productImage()));
  });
  productEnclosure = computed(() => {
    if (!this.hasEnclosureSupport()) {
      return null;
    }
    return getProductEnclosure(this.systemProduct());
  });

  isUnsupportedHardware = computed(() => this.isEnterprise() && !this.isIxHardware());

  constructor(private router: Router) { }

  goToEnclosure(): void {
    if (!this.hasEnclosureSupport()) {
      return;
    }
    this.router.navigate(['/system/oldviewenclosure']);
  }
}
