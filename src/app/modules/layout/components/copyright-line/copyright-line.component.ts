import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map, startWith } from 'rxjs';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import { AppsState } from 'app/store';
import { selectBuildYear, selectProductType } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-copyright-line',
  templateUrl: './copyright-line.component.html',
  styleUrls: ['./copyright-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyrightLineComponent {
  readonly withIxLogo = input(false);
  readonly product = toSignal(this.store$.select(selectProductType).pipe(
    startWith(ProductType.Scale),
    map((type) => productTypeLabels.get(type)),
  ));
  readonly copyrightYear = toSignal(this.store$.select(selectBuildYear));

  constructor(
    private store$: Store<AppsState>,
  ) { }
}
