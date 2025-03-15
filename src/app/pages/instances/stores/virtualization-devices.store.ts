import { computed, Injectable } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  switchMap, catchError, tap,
  EMPTY,
  filter,
} from 'rxjs';
import { VirtualizationDevice } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface VirtualizationInstanceDeviceState {
  isLoading: boolean;
  devices: VirtualizationDevice[];
}

const initialState: VirtualizationInstanceDeviceState = {
  isLoading: false,
  devices: [],
};

@UntilDestroy()
@Injectable()
export class VirtualizationDevicesStore extends ComponentStore<VirtualizationInstanceDeviceState> {
  readonly stateAsSignal = toSignal(this.state$, { initialValue: initialState });
  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly devices = computed(() => this.stateAsSignal().devices);
  private readonly selectedInstance = this.instanceStore.selectedInstance;
  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private instanceStore: VirtualizationInstancesStore,
  ) {
    super(initialState);
    toObservable(this.selectedInstance).pipe(
      tap((instance) => {
        if (!instance) {
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
        return this.api.call('virt.instance.device_list', [this.selectedInstance().id]).pipe(
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
