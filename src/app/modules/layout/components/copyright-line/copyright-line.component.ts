import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { AppState } from 'app/store';
import { selectBuildYear, selectProductType } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-copyright-line',
  templateUrl: './copyright-line.component.html',
  styleUrls: ['./copyright-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyrightLineComponent {
  readonly withIxLogo = input(false);
  readonly product = toSignal(this.store$.select(selectProductType).pipe(map((type) => productTypeLabels.get(type))));
  readonly copyrightYear = toSignal(this.store$.select(selectBuildYear));

  constructor(
    private store$: Store<AppState>,
  ) { }
}
