import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-mini-drive-details',
  templateUrl: './mini-drive-details.component.html',
  styleUrl: './mini-drive-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniDriveDetailsComponent {
  readonly selectedSlot = this.store.selectedSlot;

  constructor(
    private store: EnclosureStore,
  ) {}

  onClosePressed(): void {
    this.store.selectSlot(null);
  }
}
