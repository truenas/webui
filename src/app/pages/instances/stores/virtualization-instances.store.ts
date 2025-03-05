import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { of, switchMap, tap } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface VirtualizationInstancesState {
  isLoading: boolean;
  instances: VirtualizationInstance[] | undefined;
}

const initialState: VirtualizationInstancesState = {
  isLoading: true,
  instances: undefined,
};

@UntilDestroy()
@Injectable()
export class VirtualizationInstancesStore extends ComponentStore<VirtualizationInstancesState> {
  readonly stateAsSignal = toSignal(this.state$, { initialValue: initialState });
  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly instances = computed(() => {
    return this.stateAsSignal().instances?.filter((instance) => !!instance) ?? [];
  });

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
                case CollectionChangeType.Added:
                  return [...instances, event.fields];
                case CollectionChangeType.Changed:
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
                case CollectionChangeType.Removed:
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
          catchError((error: unknown) => {
            this.patchState({ isLoading: false, instances: [] });
            this.errorHandler.showErrorModal(error);
            return of(undefined);
          }),
        );
      }),
      untilDestroyed(this),
    );
  });

  instanceUpdated(updated: VirtualizationInstance): void {
    const instances = this.instances().map((instance) => (updated.id === instance.id ? updated : instance));
    this.patchState({ instances });
  }
}
