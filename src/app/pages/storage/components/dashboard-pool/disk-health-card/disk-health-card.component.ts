import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective, TnCardHeaderDirective,
  TnTestIdDirective,
} from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { TemperatureUnit } from 'app/enums/temperature.enum';
import { StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { diskHealthCardElements } from 'app/pages/storage/components/dashboard-pool/disk-health-card/disk-health-card.elements';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { getPoolDisks } from 'app/pages/storage/modules/disks/utils/get-pool-disks.utils';

interface DiskState {
  highestTemperature: number | null;
  lowestTemperature: number | null;
  averageTemperature: number | null;
  alerts: number;
  unit: TemperatureUnit;
}

@Component({
  selector: 'ix-disk-health-card',
  templateUrl: './disk-health-card.component.html',
  styleUrls: ['./disk-health-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    PoolCardIconComponent,
    TnButtonComponent,
    TnTestIdDirective,
    RouterLink,
    TranslateModule,
    DecimalPipe,
  ],
})
export class DiskHealthCardComponent {
  private translate = inject(TranslateService);

  readonly poolState = input.required<Pool>();
  readonly disks = input<StorageDashboardDisk[]>([]);

  protected readonly searchableElements = diskHealthCardElements;

  get disksNames(): string[] {
    return getPoolDisks(this.poolState());
  }

  get isTemperatureDataAvailable(): boolean {
    return this.isHighestTempReady || this.isLowestTempReady || this.isAverageTempReady;
  }

  protected readonly diskState = computed<DiskState>(() => {
    const disks = this.disks() || [];
    let highestTemperature: number | null = null;
    let lowestTemperature: number | null = null;
    let avgSum = 0;
    let avgCounter = 0;

    for (const disk of disks) {
      if (!disk.tempAggregates) {
        continue;
      }

      const { min, max, avg } = disk.tempAggregates;

      if (max != null) {
        highestTemperature = highestTemperature === null ? max : Math.max(highestTemperature, max);
      }

      if (min != null) {
        lowestTemperature = lowestTemperature === null ? min : Math.min(lowestTemperature, min);
      }

      if (avg != null) {
        avgSum += avg;
        avgCounter++;
      }
    }

    return {
      highestTemperature,
      lowestTemperature,
      averageTemperature: avgCounter ? avgSum / avgCounter : null,
      alerts: disks.reduce((total, current) => total + current.alerts.length, 0),
      unit: TemperatureUnit.Celsius,
    };
  });

  get isAverageTempReady(): boolean {
    return this.diskState().averageTemperature !== null && !Number.isNaN(this.diskState().averageTemperature);
  }

  get isHighestTempReady(): boolean {
    return this.diskState().highestTemperature !== null && !Number.isNaN(this.diskState().highestTemperature);
  }

  get isLowestTempReady(): boolean {
    return this.diskState().lowestTemperature !== null && !Number.isNaN(this.diskState().lowestTemperature);
  }

  get iconType(): PoolCardIconType {
    if (this.diskState().alerts) {
      return PoolCardIconType.Warn;
    }
    return PoolCardIconType.Safe;
  }

  get iconTooltip(): string {
    if (this.diskState().alerts) {
      return this.translate.instant('Pool Disks have {alerts} alerts.', {
        alerts: this.diskState().alerts,
      });
    }
    return this.translate.instant('Everything is fine');
  }
}
