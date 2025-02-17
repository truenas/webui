import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectCopyrightHtml, selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-copyright-line',
  templateUrl: './copyright-line.component.html',
  styleUrls: ['./copyright-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TestDirective],
})
export class CopyrightLineComponent {
  readonly copyrightText = toSignal(this.store$.select(selectCopyrightHtml));

  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  readonly targetHref = computed(() => {
    return this.isEnterprise() ? 'https://truenas.com/production' : 'https://truenas.com/testdrive';
  });

  constructor(private store$: Store<AppState>) { }
}
