import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TnTestIdDirective } from '@truenas/ui-components';
import { getCopyrightHtml } from 'app/helpers/copyright-text.helper';
import { AppState } from 'app/store';
import { selectCopyrightHtml, selectIsCommercialOrEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-copyright-line',
  templateUrl: './copyright-line.component.html',
  styleUrls: ['./copyright-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnTestIdDirective],
})
export class CopyrightLineComponent {
  private store$ = inject<Store<AppState>>(Store);

  skipType = input(false);

  readonly copyrightHtml = toSignal(this.store$.select(selectCopyrightHtml));
  readonly copyrightText = computed(() => (this.skipType() ? getCopyrightHtml() : this.copyrightHtml()));

  readonly isCommercialOrEnterprise = toSignal(this.store$.select(selectIsCommercialOrEnterprise));
  readonly targetHref = computed(() => {
    return this.isCommercialOrEnterprise() ? 'https://truenas.com/production' : 'https://truenas.com/testdrive';
  });
}
