import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { diskStatusTint } from 'app/pages/system/enclosure/utils/disk-status-tint.utils';

@Component({
  selector: 'ix-status-view',
  templateUrl: './status-view.component.html',
  styleUrl: '../_enclosure-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusViewComponent {
  readonly enclosure = this.store.selectedEnclosure;
  readonly selectedSlot = this.store.selectedSlot;
  readonly selectedEnclosureSlots = this.store.selectedEnclosureSlots;
  readonly selectedSide = this.store.selectedSide;

  constructor(
    private store: EnclosureStore,
  ) {}

  protected onSlotSelected(slot: DashboardEnclosureSlot): void {
    this.store.selectSlot(slot.drive_bay_number);
  }

  readonly diskStatusTint = diskStatusTint;
}
