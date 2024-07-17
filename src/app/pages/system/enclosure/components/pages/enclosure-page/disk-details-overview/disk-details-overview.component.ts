import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DriveBayLightStatus } from 'app/enums/enclosure-slot-status.enum';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-disk-details-overview',
  templateUrl: './disk-details-overview.component.html',
  styleUrls: ['./disk-details-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskDetailsOverviewComponent {
  readonly selectedSlot = this.store.selectedSlot;

  readonly diskName = computed(() => {
    return this.selectedSlot().dev || this.selectedSlot().descriptor;
  });

  constructor(
    private store: EnclosureStore,
    private ws: WebSocketService,
  ) {}

  // TODO: No indication, no way to clear it.
  protected identifyDrive(): void {
    this.ws.call('enclosure2.set_slot_status', {
      status: DriveBayLightStatus.Identify,
      slot: this.selectedSlot().drive_bay_number,
      enclosure_id: this.store.selectedEnclosure().id,
    })
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  protected closeDetails(): void {
    this.store.selectSlot(null);
  }
}
