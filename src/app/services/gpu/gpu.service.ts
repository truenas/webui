import { Injectable, inject } from '@angular/core';
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
import { GpuPciChoices } from 'app/interfaces/gpu-pci-choice.interface';
import { SelectOption } from 'app/interfaces/option.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Injectable({
  providedIn: 'root',
})
export class GpuService {
  private api = inject(ApiService);
  private store$ = inject<Store<AppState>>(Store);

  private allGpus$: Observable<Device[]>;

  /**
   * Loads all system gpus with caching.
   */
  getAllGpus(): Observable<Device[]> {
    if (!this.allGpus$) {
      this.allGpus$ = this.api.call('device.get_info', [{ type: DeviceType.Gpu }]).pipe(
        shareReplay({
          refCount: false,
          bufferSize: 1,
        }),
      );
    }

    return this.allGpus$;
  }

  getGpuOptions(): Observable<SelectOption[]> {
    return this.getRawGpuPciChoices().pipe(
      map((choices) => this.transformGpuChoicesToOptions(choices)),
    );
  }

  /**
   * Transform raw GPU choices to select options.
   * Can be used with cached observables to avoid duplicate API calls.
   */
  transformGpuChoicesToOptions(choices: GpuPciChoices): SelectOption[] {
    return Object.entries(choices).map(
      ([label, choice]): SelectOption => ({
        value: choice.pci_slot,
        label: choice.uses_system_critical_devices ? `${label} (System Critical)` : label,
        disabled: false,
      }),
    );
  }

  /**
   * Get raw GPU PCI choices from the API.
   */
  getRawGpuPciChoices(): Observable<GpuPciChoices> {
    return this.api.call('system.advanced.get_gpu_pci_choices');
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

        return this.api.call('system.advanced.update_gpu_pci_ids', [Array.from(newIsolatedGpuIds)]).pipe(
          tap(() => this.store$.dispatch(advancedConfigUpdated())),
        );
      }),

    );
  }
}
