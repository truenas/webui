import { Injectable } from '@angular/core';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { Dataset } from 'app/interfaces/dataset.interface';
import { VolumeData, VolumesData } from 'app/interfaces/volume-data.interface';
import { WebSocketService } from 'app/services/ws.service';

/**
 * This service provides data for widgets.
 *
 * 1. Do not do processing here. Process in widgets if necessary.
 * 2. Share responses via `shareReplay` to prevent multiple requests.
 * 3. Use `toLoadingState` to provide widget with loading status.
 * 4. Use subscriptions when possible.
 */
@Injectable({
  providedIn: 'root',
})
export class WidgetResourcesService {
  // TODO: nosub is emitted for some reason
  readonly realtimeUpdates$ = this.ws.subscribe('reporting.realtime');

  readonly systemInfo$ = this.ws.call('webui.main.dashboard.sys_info').pipe(
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly networkInterfaces$ = this.ws.call('interface.query').pipe(
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly pools$ = this.ws.callAndSubscribe('pool.query');

  readonly volumesData$ = this.pools$.pipe(
    switchMap(() => this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }])),
    map((datasets) => this.parseVolumeData(datasets)),
  );

  constructor(
    private ws: WebSocketService,
  ) {}

  private parseVolumeData(datasets: Dataset[]): VolumesData {
    const volumesData = new Map<string, VolumeData>();

    datasets.forEach((dataset) => {
      if (typeof dataset === undefined || !dataset) {
        return;
      }

      volumesData.set(dataset.id, {
        id: dataset.id,
        avail: dataset.available.parsed,
        name: dataset.name,
        used: dataset.used.parsed,
        used_pct: (dataset.used.parsed / (dataset.used.parsed + dataset.available.parsed) * 100).toFixed(0) + '%',
      });
    });
    return volumesData;
  }
}
