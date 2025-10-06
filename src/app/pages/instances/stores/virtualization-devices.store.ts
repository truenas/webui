import { computed, Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  switchMap, catchError, tap,
  EMPTY,
  filter,
} from 'rxjs';
import { VirtualizationDevice } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface ContainerInstanceDeviceState {
  isLoading: boolean;
  devices: VirtualizationDevice[];
}

const initialState: ContainerInstanceDeviceState = {
  isLoading: false,
  devices: [],
};

@UntilDestroy()
@Injectable()
export class VirtualizationDevicesStore extends ComponentStore<ContainerInstanceDeviceState> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private instanceStore = inject(VirtualizationInstancesStore);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly devices = computed(() => this.state().devices);
  private readonly selectedInstance = this.instanceStore.selectedInstance;
  constructor() {
    super(initialState);
    toObservable(this.selectedInstance).pipe(
      tap((instance) => {
        if (!instance) {
          this.patchState({ devices: [] });
        }
      }),
      filter(Boolean),
      // tap(() => this.loadDevices()),
    ).pipe(untilDestroyed(this)).subscribe();
  }

  readonly loadDevices = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        this.patchState({ isLoading: true });
        return this.api.call('virt.instance.device_list', [this.selectedInstance().id.toString()]).pipe(
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

  deviceDeleted(deviceName: string): void {
    const devices = this.devices().filter((device) => device.name !== deviceName);
    this.patchState({ devices });
  }
}
