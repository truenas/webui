import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-mini-pools',
  templateUrl: './mini-pools.component.html',
  styleUrl: './mini-pools.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniPoolsComponent {
  readonly slots = this.store.selectedEnclosureSlots;
  readonly poolColors = this.store.poolColors;

  constructor(
    private store: EnclosureStore,
  ) {}
}
