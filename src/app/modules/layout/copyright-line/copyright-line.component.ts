import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { ProductType } from 'app/enums/product-type.enum';
import { getCopyrightHtml } from 'app/helpers/copyright-text.helper';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import {
  selectBrandedProductType, selectCopyrightHtml, selectProductType,
} from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-copyright-line',
  templateUrl: './copyright-line.component.html',
  styleUrls: ['./copyright-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TestDirective],
})
export class CopyrightLineComponent {
  private store$ = inject<Store<AppState>>(Store);

  skipType = input(false);

  readonly copyrightHtml = toSignal(this.store$.select(selectCopyrightHtml));
  readonly copyrightText = computed(() => (this.skipType() ? getCopyrightHtml() : this.copyrightHtml()));

  private readonly productType = toSignal(this.store$.select(selectProductType));
  private readonly brandedProductType = toSignal(this.store$.select(selectBrandedProductType));
  readonly targetHref = computed(() => {
    switch (this.brandedProductType()) {
      case ProductType.Enterprise:
        return 'https://truenas.com/production';
      case ProductType.CommunityEdition:
        return 'https://truenas.com/testdrive';
      default:
        // Enterprise whose license is not known yet: neutral home page rather than
        // guessing an edition. Otherwise (e.g. sign-in page, where the product type
        // is never loaded) keep the historical testdrive link.
        return this.productType() === ProductType.Enterprise ? 'https://truenas.com/' : 'https://truenas.com/testdrive';
    }
  });
}
