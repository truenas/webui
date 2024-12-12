import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { TemperatureUnit } from 'app/enums/temperature.enum';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';

@Component({
  selector: 'ix-mini-drive-temperatures',
  templateUrl: './mini-drive-temperatures.component.html',
  styleUrl: './mini-drive-temperatures.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgxSkeletonLoaderModule,
    TooltipComponent,
    TranslateModule,
    OrNotAvailablePipe,
  ],
})
export class MiniDriveTemperaturesComponent {
  private temperature = toSignal(this.diskTemperatureService.getTemperature());
  private celsius = TemperatureUnit.Celsius;
  private readonly slots = computed(() => {
    return getSlotsOfSide(this.store.selectedEnclosure(), EnclosureSide.Front);
  });

  isLoading = computed(() => !this.temperature());

  protected readonly disks = computed(() => {
    return this.slots()
      .filter((slot) => slot.dev)
      .map(({ dev }) => {
        const data = this.temperature();
        return {
          dev,
          temperature: data?.[dev] ? `${data[dev]} ${this.celsius}` : null,
        };
      });
  });

  constructor(
    private store: EnclosureStore,
    private diskTemperatureService: DiskTemperatureService,
  ) { }
}
