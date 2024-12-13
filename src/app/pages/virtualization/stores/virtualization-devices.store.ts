import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';
import {
  switchMap, catchError, tap,
  EMPTY,
} from 'rxjs';
import { VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

export interface VirtualizationInstanceDeviceState {
  isLoading: boolean;
  devices: VirtualizationDevice[];
  selectedInstance: VirtualizationInstance;
}

const initialState: VirtualizationInstanceDeviceState = {
  isLoading: false,
  devices: [],
  selectedInstance: null,
};

@Injectable()
export class VirtualizationDevicesStore extends ComponentStore<VirtualizationInstanceDeviceState> {
  readonly stateAsSignal = toSignal(this.state$, { initialValue: initialState });
  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly devices = computed(() => this.stateAsSignal().devices);
  readonly selectedInstance = computed(() => this.stateAsSignal().selectedInstance);
  readonly instances = computed(() => this.instanceStore.instances());

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private instanceStore: VirtualizationInstancesStore,
  ) {
    super(initialState);
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

  selectInstance(instanceId: string): void {
    const selectedInstance = this.instances()?.find((instance) => instance.id === instanceId);
    if (!selectedInstance?.id) {
      this.resetInstance();
      return;
    }
    const oldSelectedInstance = this.selectedInstance();
    if (!selectedInstance || selectedInstance === oldSelectedInstance) {
      return;
    }

    this.patchState({ selectedInstance });
    this.loadDevices();
  }

  resetInstance(): void {
    this.patchState({ selectedInstance: null });
  }

  deviceDeleted(deviceName: string): void {
    const devices = this.devices().filter((device) => device.name !== deviceName);
    this.patchState({ devices });
  }
}
