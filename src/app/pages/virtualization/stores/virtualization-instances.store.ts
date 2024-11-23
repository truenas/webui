import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

export interface VirtualizationInstancesState {
  isLoading: boolean;
  instances: VirtualizationInstance[];
}

const initialState: VirtualizationInstancesState = {
  isLoading: true,
  instances: [],
};

@UntilDestroy()
@Injectable()
export class VirtualizationInstancesStore extends ComponentStore<VirtualizationInstancesState> {
  readonly stateAsSignal = toSignal(this.state$, { initialValue: initialState });
  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly instances = computed(() => this.stateAsSignal().instances.filter(Boolean));

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        this.patchState({ isLoading: true });
        return this.api.call('virt.instance.query').pipe(
          switchMap((instances: VirtualizationInstance[]) => this.api.subscribe('virt.instance.query').pipe(
            startWith(null),
            map((event) => {
              switch (event?.msg) {
                case IncomingApiMessageType.Added:
                  return [...instances, event.fields];
                case IncomingApiMessageType.Changed:
                  // TODO: Keep it until API improvements
                  if (event.fields && Object.keys(event.fields).length === 1 && 'status' in event.fields) {
                    return instances.map((instance) => {
                      if (instance.name === event.id) {
                        return { ...instance, status: event.fields.status };
                      }
                      return instance;
                    });
                  }
                  return instances.map((item) => (item.id === event.id ? { ...item, ...event?.fields } : item));
                case IncomingApiMessageType.Removed:
                  return instances.filter((item) => item.id !== event.id);
                default:
                  break;
              }
              return instances;
            }),
          )),
          tap((instances) => {
            this.patchState({
              instances,
              isLoading: false,
            });
          }),
          catchError((error) => {
            this.patchState({ isLoading: false, instances: [] });
            this.errorHandler.showErrorModal(error);
            return undefined;
          }),
        );
      }),
    );
  });
}
