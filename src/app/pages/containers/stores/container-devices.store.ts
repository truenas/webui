import { computed, Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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

@UntilDestroy()
@Injectable()
export class ContainerDevicesStore extends ComponentStore<ContainerDeviceState> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private containersStore = inject(ContainersStore);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly devices = computed(() => this.state().devices);
  private readonly selectedContainer = this.containersStore.selectedContainer;

  constructor() {
    super(initialState);
    // Note: We're triggering the loadDevices effect imperatively via tap() rather than
    // passing the observable directly. This pattern works because the effect internally
    // manages its subscription, but is unconventional. The effect could alternatively
    // be refactored to accept the selectedContainer observable directly.
    toObservable(this.selectedContainer).pipe(
      tap((container) => {
        if (!container) {
          this.patchState({ devices: [] });
        }
      }),
      filter(Boolean),
      tap(() => this.loadDevices()),
    ).pipe(untilDestroyed(this)).subscribe();
  }

  readonly loadDevices = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        this.patchState({ isLoading: true });
        return this.api.call('container.device.query', [[['container', '=', this.selectedContainer().id]]]).pipe(
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
