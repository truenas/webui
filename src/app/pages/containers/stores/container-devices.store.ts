import { computed, Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';
import {
  switchMap, catchError, tap,
  EMPTY,
  filter,
  map,
  Observable,
  take,
  of,
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
    return this.api.query('container.device.query', [['container', '=', container.id]]).pipe(
      map((containerDevices) => containerDeviceEntriesToDevices(containerDevices.map(toContainerDeviceEntry))),
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
   * Removes a device from local state. Call only after the API confirmed the deletion: it makes no call
   * and handles no errors, so calling it early desyncs the UI from the backend.
   */
  deviceDeleted(deviceId: number): void {
    const devices = this.devices().filter((device) => device.id !== deviceId);
    this.patchState({ devices });
  }
}
