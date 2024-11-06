import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';
import { catchError, filter, repeat } from 'rxjs/operators';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface VirtualizationInstancesState {
  isLoading: boolean;
  instances: VirtualizationInstance[];
  selectedInstance: VirtualizationInstance;
}

const initialState: VirtualizationInstancesState = {
  isLoading: false,
  instances: [],
  selectedInstance: null,
};

@UntilDestroy()
@Injectable()
export class VirtualizationInstancesStore extends ComponentStore<VirtualizationInstancesState> {
  readonly stateAsSignal = toSignal(this.state$, { initialValue: initialState });
  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly instances = computed(() => this.stateAsSignal().instances);
  readonly selectedInstance = computed(() => this.stateAsSignal().selectedInstance);

  constructor(
    private ws: WebSocketService,
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

  selectInstance(instanceId: string): void {
    const selectedInstance = this.instances()?.find((instance) => instance.id === instanceId);
    if (selectedInstance) {
      this.patchState({ selectedInstance });
    }
  }
}
