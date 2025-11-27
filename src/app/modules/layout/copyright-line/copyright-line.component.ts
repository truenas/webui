import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { getCopyrightHtml } from 'app/helpers/copyright-text.helper';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectCopyrightHtml, selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

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

  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  readonly targetHref = computed(() => {
    return this.isEnterprise() ? 'https://truenas.com/production' : 'https://github.com/HarborNAS';
  });
}
