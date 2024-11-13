import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';
import { catchError, filter, repeat } from 'rxjs/operators';
import { VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

export interface VirtualizationInstancesState {
  isLoading: boolean;
  instances: VirtualizationInstance[];

  selectedInstance: VirtualizationInstance;
  isLoadingDevices: boolean;
  selectedInstanceDevices: VirtualizationDevice[];
}

const initialState: VirtualizationInstancesState = {
  isLoading: false,
  instances: [],

  // TODO: May belong to its own store.
  selectedInstance: null,
  isLoadingDevices: false,
  selectedInstanceDevices: [],
};

@UntilDestroy()
@Injectable()
export class VirtualizationInstancesStore extends ComponentStore<VirtualizationInstancesState> {
  readonly stateAsSignal = toSignal(this.state$, { initialValue: initialState });
  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly instances = computed(() => this.stateAsSignal().instances);

  readonly selectedInstance = computed(() => this.stateAsSignal().selectedInstance);
  readonly isLoadingDevices = computed(() => this.stateAsSignal().isLoadingDevices);
  readonly selectedInstanceDevices = computed(() => this.stateAsSignal().selectedInstanceDevices);

  constructor(
    private ws: ApiService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        return this.ws.call('virt.instance.query').pipe(
          tap(() => this.patchState({ isLoading: true })),
          repeat({
            delay: () => this.ws.subscribe('core.get_jobs').pipe(
              filter((event) => [
                'virt.instance.start',
                'virt.instance.stop',
                'virt.instance.delete',
                'virt.instance.update',
              ].includes(event.fields.method) && !!event.fields.result),
              tap(() => this.patchState({ isLoading: true })),
            ),
          }),
          tap((instances) => {
            this.patchState({
              instances,
              isLoading: false,
            });
          }),
          catchError((error) => {
            this.patchState({ isLoading: false });
            this.errorHandler.showErrorModal(error);
            return undefined;
          }),
        );
      }),
    );
  });

  readonly loadDevices = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        const selectedInstance = this.selectedInstance();
        if (!selectedInstance) {
          return [];
        }

        this.patchState({ isLoadingDevices: true });

        return this.ws.call('virt.instance.device_list', [selectedInstance.id]).pipe(
          tap((devices) => {
            this.patchState({
              selectedInstanceDevices: devices,
              isLoadingDevices: false,
            });
          }),
          catchError((error) => {
            this.patchState({ isLoadingDevices: false });
            this.errorHandler.showErrorModal(error);
            return [];
          }),
        );
      }),
    );
  });

  selectInstance(instanceId?: string): void {
    if (!instanceId) {
      this.patchState({ selectedInstance: null });
      return;
    }
    const selectedInstance = this.instances()?.find((instance) => instance.id === instanceId);
    const oldSelectedInstance = this.selectedInstance();
    if (!selectedInstance || selectedInstance === oldSelectedInstance) {
      return;
    }

    this.patchState({
      selectedInstance,
    });
    this.loadDevices();
  }
}
