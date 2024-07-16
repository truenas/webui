import {
  ChangeDetectionStrategy, Component, OnDestroy, computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';

@Component({
  selector: 'ix-mini-drive-temperatures',
  templateUrl: './mini-drive-temperatures.component.html',
  styleUrl: './mini-drive-temperatures.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniDriveTemperaturesComponent implements OnDestroy {
  private temperature = toSignal(this.diskTemperatureService.temperature$);

  private readonly slots = computed(() => {
    return getSlotsOfSide(this.store.selectedEnclosure(), EnclosureSide.Front);
  });

  protected readonly disks = computed(() => {
    return this.slots()
      .filter((slot) => slot.dev)
      .map((slot) => {
        const value = this.temperature()?.values?.[slot.dev] || null;
        const symbolText = `${this.temperature()?.symbolText}C`;
        return {
          dev: slot.dev,
          temperature: value !== null ? `${value} ${symbolText}` : undefined,
        };
      });
  });

  constructor(
    private store: EnclosureStore,
    private diskTemperatureService: DiskTemperatureService,
  ) {
    this.diskTemperatureService.listenForTemperatureUpdates();
    this.diskTemperatureService.diskTemperaturesSubscribe();
  }

  ngOnDestroy(): void {
    this.diskTemperatureService.diskTemperaturesUnsubscribe();
  }
}
