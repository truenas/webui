import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PoolsLegendComponent } from 'app/pages/system/enclosure/components/pools-legend/pools-legend.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-mini-pools',
  templateUrl: './mini-pools.component.html',
  styleUrl: './mini-pools.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PoolsLegendComponent, TranslateModule],
})
export class MiniPoolsComponent {
  private store = inject(EnclosureStore);

  readonly enclosure = this.store.selectedEnclosure;
  readonly selectedSide = this.store.selectedSide;
  readonly poolColors = this.store.poolColors;
}
