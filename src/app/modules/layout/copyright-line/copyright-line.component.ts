import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectCopyrightText } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-copyright-line',
  templateUrl: './copyright-line.component.html',
  styleUrls: ['./copyright-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TestDirective],
})
export class CopyrightLineComponent {
  readonly withIxLogo = input(false);
  readonly copyrightText = toSignal(this.store$.select(selectCopyrightText));

  constructor(private store$: Store<AppState>) { }
}
