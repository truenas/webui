import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, filter, map, switchMap, throttleTime,
} from 'rxjs';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { WebSocketService } from 'app/services/ws.service';

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

  availableSpace$ = this.kubernetesStore.selectedPool$.pipe(
    filter((pool) => !!pool),
    switchMap((pool) => {
      return this.ws.call('pool.dataset.get_instance', [`${pool}/ix-applications`]);
    }),
    map((dataset) => dataset.available.rawvalue),
  ).pipe(
    toLoadingState(),
  );

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    protected kubernetesStore: KubernetesStore,
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
