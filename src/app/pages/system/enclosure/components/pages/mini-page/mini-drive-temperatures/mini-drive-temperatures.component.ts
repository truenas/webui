import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TemperatureUnit } from 'app/enums/temperature.enum';
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
export class MiniDriveTemperaturesComponent {
  private temperature = toSignal(this.diskTemperatureService.getTemperature());
  private symbolText = TemperatureUnit.Celsius;
  private readonly slots = computed(() => {
    return getSlotsOfSide(this.store.selectedEnclosure(), EnclosureSide.Front);
  });

  isLoading = computed(() => !this.temperature());

  protected readonly disks = computed(() => {
    return this.slots()
      .filter((slot) => slot.dev)
      .map((slot) => {
        const temperature = this.temperature();
        const value = temperature ? `${temperature[slot.dev]} ${this.symbolText}` : null;
        return {
          dev: slot.dev,
          temperature: value !== null ? value : undefined,
        };
      });
  });

  constructor(
    private store: EnclosureStore,
    private diskTemperatureService: DiskTemperatureService,
  ) { }
}
