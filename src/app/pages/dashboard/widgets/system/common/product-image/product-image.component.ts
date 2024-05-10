import {
  Component, ChangeDetectionStrategy, input,
  computed,
  HostBinding,
} from '@angular/core';
import { Router } from '@angular/router';

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
  @HostBinding('class.truenas') isEnterprise = input.required<boolean>();
  product = input.required<string>();
  productImage = input.required<string>();
  hasEnclosureSupport = input.required<boolean>();
  isHaLicensed = input.required<boolean>();
  isUnsupportedHardware = input.required<boolean>();
  isCertified = input.required<boolean>();

  productImageSrc = computed(() => {
    if (!this.productImage()) {
      return 'assets/images/truenas_scale_ondark_favicon.png';
    }
    return 'assets/images' + (this.productImage().startsWith('/') ? this.productImage() : ('/' + this.productImage()));
  });

  constructor(private router: Router) { }

  goToEnclosure(): void {
    if (!this.hasEnclosureSupport) {
      return;
    }
    this.router.navigate(['/system/oldviewenclosure']);
  }
}
