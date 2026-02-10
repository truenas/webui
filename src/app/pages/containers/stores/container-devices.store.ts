import { computed, Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';
import {
  switchMap, catchError, tap,
  EMPTY,
  filter,
  map,
  Observable,
  distinctUntilChanged,
  take,
  of,
} from 'rxjs';
import { Container, ContainerDevice } from 'app/interfaces/container.interface';
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
export class ContainerDevicesStore extends ComponentStore<ContainerDeviceState> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private containersStore = inject(ContainersStore);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly devices = computed(() => this.state().devices);
  readonly gpuChoices = computed(() => this.state().gpuChoices);
  readonly isLoadingGpuChoices = computed(() => this.state().isLoadingGpuChoices);
  private readonly selectedContainer = this.containersStore.selectedContainer;

  readonly loadDevices = this.effect((container$: Observable<Container | undefined>) => {
    return container$.pipe(
      tap((container) => {
        if (!container) {
          this.patchState({ devices: [], isLoading: false });
        }
      }),
      filter(Boolean),
      distinctUntilChanged((prev, curr) => prev.id === curr.id),
      switchMap((container) => this.fetchDevicesForContainer(container)),
    );
  });

  constructor() {
    super(initialState);
    this.loadDevices(toObservable(this.selectedContainer));
    this.loadGpuChoices();
  }

  private loadGpuChoices(): void {
    this.patchState({ isLoadingGpuChoices: true });
    this.api.call('container.device.gpu_choices').pipe(
      take(1),
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return of({});
      }),
    ).subscribe((gpuChoices) => {
      this.patchState({
        gpuChoices,
        isLoadingGpuChoices: false,
      });
    });
  }

  /**
   * Manually reload devices for the currently selected container.
   * Use this after device operations (add/edit/delete) to refresh the list.
   */
  reload(): void {
    const container = this.selectedContainer();
    if (container) {
      this.fetchDevicesForContainer(container).pipe(take(1)).subscribe();
    }
  }

  private fetchDevicesForContainer(container: Container): Observable<ContainerDevice[]> {
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
