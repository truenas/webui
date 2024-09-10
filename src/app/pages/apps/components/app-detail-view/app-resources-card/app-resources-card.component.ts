import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map, throttleTime } from 'rxjs';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-resources-card',
  templateUrl: './app-resources-card.component.html',
  styleUrls: ['./app-resources-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppResourcesCardComponent implements OnInit {
  isLoading = input<boolean>(true);
  cpuPercentage = 0;
  memoryUsed: number;
  memoryTotal: number;

  availableSpace = toSignal(this.ws.call('app.available_space'));
  selectedPool = toSignal(this.dockerStore.selectedPool$);

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dockerStore: DockerStore,
  ) {}

  ngOnInit(): void {
    this.getResourcesUsageUpdates();
  }

  getResourcesUsageUpdates(): void {
    this.ws.subscribe('reporting.realtime').pipe(
      map((event) => event.fields),
      throttleTime(2000),
      untilDestroyed(this),
    ).subscribe((update) => {
      if (update?.cpu?.average) {
        this.cpuPercentage = parseInt(update.cpu.average.usage.toFixed(1));
      }

      if (update?.virtual_memory) {
        const memStats: MemoryStatsEventData = { ...update.virtual_memory };

        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
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
}
