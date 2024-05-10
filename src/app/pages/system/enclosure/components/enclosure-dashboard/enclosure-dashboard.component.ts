import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-enclosure-dashboard',
  templateUrl: './enclosure-dashboard.component.html',
  styleUrls: ['./enclosure-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureDashboardComponent {
  readonly selectedEnclosure$ = this.enclosureStore.selectedEnclosure$;
  readonly selectedSlot$ = this.enclosureStore.selectedSlot$;

  constructor(
    private enclosureStore: EnclosureStore,
  ) {
    this.enclosureStore.initiate();
  }
}
