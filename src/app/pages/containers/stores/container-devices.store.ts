import { Injectable, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  filter, map, pipe, switchMap, tap,
} from 'rxjs';
import { Container, ContainerDevice, toContainerDeviceEntry } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { containerDeviceEntriesToDevices } from 'app/pages/containers/utils/container-device.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface ContainerDeviceState {
  isLoading: boolean;
  devices: ContainerDevice[];
  gpuChoices: Record<string, string> | null;
  isLoadingGpuChoices: boolean;
}

const initialState: ContainerDeviceState = {
  isLoading: false,
  devices: [],
  gpuChoices: null,
  isLoadingGpuChoices: false,
};

@Injectable()
export class ContainerDevicesStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private containersStore = inject(ContainersStore);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly devices = this.state.devices;
  readonly gpuChoices = this.state.gpuChoices;
  readonly isLoadingGpuChoices = this.state.isLoadingGpuChoices;
  private readonly selectedContainer = this.containersStore.selectedContainer;

  /**
   * Loads devices of a container, or clears them when there is none. Both the selection tracking
   * and `reload()` feed it, so a newer request always replaces an older one still in flight.
   */
  private readonly loadDevices = rxMethod<Container | undefined>(pipe(
    tap((container) => {
      if (!container) {
        patchState(this.state, { devices: [], isLoading: false });
      }
    }),
    filter(Boolean),
    tap(() => patchState(this.state, { isLoading: true })),
    switchMap((container) => this.api.query('container.device.query', [['container', '=', container.id]]).pipe(
      map((containerDevices) => containerDeviceEntriesToDevices(containerDevices.map(toContainerDeviceEntry))),
      tapResponse({
        next: (devices) => patchState(this.state, { devices }),
        error: (error: unknown) => {
          patchState(this.state, { devices: [] });
          this.errorHandler.showErrorModal(error);
        },
        finalize: () => patchState(this.state, { isLoading: false }),
      }),
    )),
  ));

  private readonly loadGpuChoices = rxMethod<void>(pipe(
    tap(() => patchState(this.state, { isLoadingGpuChoices: true })),
    switchMap(() => this.api.call('container.device.gpu_choices').pipe(
      tapResponse({
        next: (gpuChoices) => patchState(this.state, { gpuChoices }),
        error: (error: unknown) => {
          patchState(this.state, { gpuChoices: {} });
          this.errorHandler.showErrorModal(error);
        },
        finalize: () => patchState(this.state, { isLoadingGpuChoices: false }),
      }),
    )),
  ));

  constructor() {
    this.loadDevices(this.selectedContainer);
    this.loadGpuChoices();
  }

  /**
   * Manually reload devices for the currently selected container.
   * Use this after device operations (add/edit/delete) to refresh the list.
   */
  reload(): void {
    const container = this.selectedContainer();
    if (container) {
      this.loadDevices(container);
    }
  }

  /**
   * Removes a device from local state. Call only after the API confirmed the deletion: it makes no call
   * and handles no errors, so calling it early desyncs the UI from the backend.
   */
  deviceDeleted(deviceId: number): void {
    patchState(this.state, (state) => ({
      devices: state.devices.filter((device) => device.id !== deviceId),
    }));
  }
}
