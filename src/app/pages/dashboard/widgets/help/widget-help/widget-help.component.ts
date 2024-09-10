import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { helptextAbout } from 'app/helptext/about';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { AppsState } from 'app/store';
import { selectIsEnterprise, selectProductType } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-widget-help',
  templateUrl: './widget-help.component.html',
  styleUrl: './widget-help.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetHelpComponent {
  size = input.required<SlotSize>();
  fullSize = computed(() => this.size() === SlotSize.Full);

  product = toSignal(this.store$.select(selectProductType).pipe(map((type) => productTypeLabels.get(type))));
  isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  protected readonly helptext = helptextAbout;

  constructor(private store$: Store<AppsState>) {}
}
