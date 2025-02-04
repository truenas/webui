import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { map, throttleTime } from 'rxjs';
import { MemoryUpdate } from 'app/interfaces/reporting.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';

@UntilDestroy()
@Component({
  selector: 'ix-app-resources-card',
  templateUrl: './app-resources-card.component.html',
  styleUrls: ['./app-resources-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    NgxSkeletonLoaderModule,
    FileSizePipe,
    AsyncPipe,
  ],
})
export class AppResourcesCardComponent implements OnInit {
  readonly isLoading = input<boolean>();
  readonly cpuPercentage = signal(0);
  readonly memoryUsed = signal(0);
  readonly memoryTotal = signal(0);
  readonly availableSpace$ = this.api.call('app.available_space');
  readonly selectedPool = toSignal(this.dockerStore.selectedPool$);

  constructor(
    private api: ApiService,
    private dockerStore: DockerStore,
  ) {}

  ngOnInit(): void {
    this.getResourcesUsageUpdates();
  }

  getResourcesUsageUpdates(): void {
    this.api.subscribe('reporting.realtime').pipe(
      map((event) => event.fields),
      throttleTime(2000),
      untilDestroyed(this),
    ).subscribe((update) => {
      if (update?.cpu?.cpu?.usage) {
        this.cpuPercentage.set(parseInt(update.cpu.cpu.usage.toFixed(1)));
      }

      if (update?.memory) {
        const memStats: MemoryUpdate = { ...update.memory };

        const services = memStats.physical_memory_total - memStats.physical_memory_available - memStats.arc_size;
        this.memoryUsed.set(memStats.arc_size + services);
        this.memoryTotal.set(memStats.physical_memory_total);
      }
    });
  }
}
