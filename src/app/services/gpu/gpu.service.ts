import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  combineLatest, Observable,
  of,
} from 'rxjs';
import {
  map, shareReplay, switchMap, take,
  tap,
} from 'rxjs/operators';
import { DeviceType } from 'app/enums/device-type.enum';
import { Device } from 'app/interfaces/device.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Injectable({
  providedIn: 'root',
})
export class GpuService {
  private allGpus$: Observable<Device[]>;

  constructor(
    private ws: WebSocketService,
    private store$: Store<AppState>,
  ) {}

  /**
   * Loads all system gpus with caching.
   */
  getAllGpus(): Observable<Device[]> {
    if (!this.allGpus$) {
      this.allGpus$ = this.ws.call('device.get_info', [{ type: DeviceType.Gpu }]).pipe(
        shareReplay({
          refCount: false,
          bufferSize: 1,
        }),
      );
    }

    return this.allGpus$;
  }

  getGpuOptions(): Observable<Option[]> {
    return this.ws.call('system.advanced.get_gpu_pci_choices').pipe(
      map((choices) => {
        return Object.entries(choices).map(
          ([value, label]) => ({ value: label, label: value }),
        );
      }),
    );
  }

  getIsolatedGpuPciIds(): Observable<string[]> {
    return this.store$.pipe(
      waitForAdvancedConfig,
      take(1),
      map((advancedConfig) => advancedConfig.isolated_gpu_pci_ids),
    );
  }

  getIsolatedGpus(): Observable<Device[]> {
    return combineLatest([
      this.getAllGpus(),
      this.getIsolatedGpuPciIds(),
    ])
      .pipe(
        map(([allGpus, isolatedGpuPciIds]) => {
          return allGpus.filter((gpu) => isolatedGpuPciIds.includes(gpu.addr.pci_slot));
        }),
      );
  }

  addIsolatedGpuPciIds(idsToIsolate: string[]): Observable<void> {
    return this.getIsolatedGpuPciIds().pipe(
      take(1),
      switchMap((oldIsolatedGpuIds) => {
        const newIsolatedGpuIds = new Set([
          ...oldIsolatedGpuIds,
          ...idsToIsolate,
        ]);
        if (newIsolatedGpuIds.size === oldIsolatedGpuIds.length) {
          return of(undefined);
        }

        return this.ws.call('system.advanced.update_gpu_pci_ids', [Array.from(newIsolatedGpuIds)]).pipe(
          tap(() => this.store$.dispatch(advancedConfigUpdated())),
        );
      }),

    );
  }
}
