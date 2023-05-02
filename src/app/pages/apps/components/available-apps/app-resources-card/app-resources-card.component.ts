import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, map, throttleTime } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-app-resources-card',
  templateUrl: './app-resources-card.component.html',
  styleUrls: ['./app-resources-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppResourcesCardComponent implements OnInit {
  @Input() isLoading$: Observable<boolean>;
  cpuPercentage = 0;
  memoryUsed: number;
  memoryTotal: number;
  pool: string;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    protected applicationsStore: AvailableAppsStore,
  ) {}

  ngOnInit(): void {
    this.ws.subscribe('reporting.realtime').pipe(
      map((event) => event.fields),
      throttleTime(500),
      untilDestroyed(this),
    ).subscribe((update) => {
      if (update?.cpu?.average) {
        this.cpuPercentage = parseInt(update.cpu.average.usage.toFixed(1));
      }

      if (update.virtual_memory) {
        const memStats: MemoryStatsEventData = { ...update.virtual_memory };

        if (update.zfs && update.zfs.arc_size !== null) {
          memStats.arc_size = update.zfs.arc_size;
        }
        const services = memStats.total - memStats.free - memStats.arc_size;
        this.memoryUsed = memStats.arc_size + services;
        this.memoryTotal = memStats.total;
      }
      this.cdr.markForCheck();
    });
  }

  bytesToGigabytes(value: number): number {
    return value / GiB;
  }
}
