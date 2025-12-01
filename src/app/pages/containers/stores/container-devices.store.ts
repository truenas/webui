import { computed, DestroyRef, Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';
import {
  switchMap, catchError, tap,
  EMPTY,
  filter,
  map,
} from 'rxjs';
import { ContainerDevice } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { containerDeviceEntriesToDevices } from 'app/pages/containers/utils/container-device.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface ContainerDeviceState {
  isLoading: boolean;
  devices: ContainerDevice[];
}

const initialState: ContainerDeviceState = {
  isLoading: false,
  devices: [],
};

@Injectable()
export class ContainerDevicesStore extends ComponentStore<ContainerDeviceState> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private containersStore = inject(ContainersStore);
  private destroyRef = inject(DestroyRef);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly devices = computed(() => this.state().devices);
  private readonly selectedContainer = this.containersStore.selectedContainer;

  readonly loadDevices = this.effect((container$) => {
    return container$.pipe(
      tap((container) => {
        if (!container) {
          this.patchState({ devices: [], isLoading: false });
        }
      }),
      filter(Boolean),
      switchMap((container) => {
        this.patchState({ isLoading: true });
        return this.api.call('container.device.query', [[['container', '=', container.id]]]).pipe(
          map((containerDevices) => containerDeviceEntriesToDevices(containerDevices)),
          tap((devices) => {
            this.patchState({
              devices,
              isLoading: false,
            });
          }),
          catchError((error: unknown) => {
            this.patchState({ isLoading: false, devices: [] });
            this.errorHandler.showErrorModal(error);
            return EMPTY;
          }),
        );
      }),
    );
  });

  constructor() {
    super(initialState);
    this.loadDevices(toObservable(this.selectedContainer));
  }

  /**
   * Optimistically removes a device from the local state after successful deletion.
   *
   * IMPORTANT: This method should ONLY be called after confirming successful deletion
   * from the API (e.g., within a successful tap() operator). It does not perform any
   * API calls or error handling - it simply updates the local state.
   *
   * If called prematurely or without API confirmation, it will cause UI inconsistency
   * with the backend state.
   *
   * @param deviceId The ID of the device that was successfully deleted via API
   */
  deviceDeleted(deviceId: number): void {
    const devices = this.devices().filter((device) => device.id !== deviceId);
    this.patchState({ devices });
  }
}
