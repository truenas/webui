import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { isEqual } from 'lodash-es';
import {
  of, Subject, switchMap, tap,
} from 'rxjs';
import {
  catchError, takeUntil,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEventTyped } from 'app/interfaces/api-message.interface';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface VirtualizationInstancesState {
  isLoading: boolean;
  instances: VirtualizationInstance[] | undefined;
  selectedInstanceId: string | null;
  selectedInstance: VirtualizationInstance | undefined;
}

const initialState: VirtualizationInstancesState = {
  isLoading: true,
  instances: undefined,
  selectedInstanceId: null,
  selectedInstance: undefined,
};

@UntilDestroy()
@Injectable()
export class VirtualizationInstancesStore extends ComponentStore<VirtualizationInstancesState> {
  readonly stateAsSignal = toSignal(this.state$, { initialValue: initialState });
  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly selectedInstance = computed(() => this.stateAsSignal().selectedInstance);
  readonly selectedInstanceId = computed(() => this.stateAsSignal().selectedInstanceId);
  readonly instances = computed(() => {
    return this.stateAsSignal().instances?.filter((instance) => !!instance) ?? [];
  });

  private readonly destroySubscription$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
  ) {
    super(initialState);
  }

  readonly initialize = this.effect((trigger$) => {
    this.destroySubscription$.next();
    return trigger$.pipe(
      switchMap(() => {
        return this.api.call('virt.instance.query').pipe(
          tap((instances) => {
            const selectedInstanceId = this.selectedInstanceId();
            const selectedInstance = this.selectedInstance();

            if (!selectedInstance || selectedInstance.id !== selectedInstanceId) {
              const updatedSelectedInstance = instances.find((instance) => instance.id === selectedInstanceId);
              if (updatedSelectedInstance) {
                this.patchState({ selectedInstance: updatedSelectedInstance });
              } else if (instances.length) {
                this.router.navigate(['/instances', 'view', instances[0].id]);
              } else {
                this.router.navigate(['/instances']);
              }
            }
          }),
          tap((instances) => {
            this.patchState({
              instances,
              isLoading: false,
            });
          }),
          switchMap(() => {
            return this.api.subscribe('virt.instance.query').pipe(
              tap((event) => this.processInstanceUpdateEvent(event)),
            );
          }),
          catchError((error: unknown) => {
            this.patchState({ isLoading: false, instances: [] });
            this.errorHandler.showErrorModal(error);
            return of(undefined);
          }),
          takeUntil(this.destroySubscription$),
        );
      }),
      untilDestroyed(this),
    );
  });

  private processInstanceUpdateEvent(
    event: ApiEventTyped<'virt.instance.query'>,
  ): void {
    const prevInstances = this.instances();
    switch (event?.msg) {
      case CollectionChangeType.Added:
        this.patchState({ instances: [...prevInstances, event.fields] });
        break;
      case CollectionChangeType.Changed:
        // TODO: Keep it until API improvements
        if (event.fields && Object.keys(event.fields).length === 1 && 'status' in event.fields) {
          const changedInstances = prevInstances.map((instance) => {
            if (instance.name === event.id) {
              return { ...instance, status: event.fields.status };
            }
            return instance;
          });
          this.patchState({ instances: changedInstances });
        }
        this.patchState({
          instances: prevInstances.map((item) => (item.id === event.id ? { ...item, ...event?.fields } : item)),
        });
        break;
      case CollectionChangeType.Removed:
        this.patchState({ instances: prevInstances.filter((item) => item.id !== event.id) });
        break;
    }
  }

  instanceUpdated(updated: VirtualizationInstance): void {
    const instances = this.instances().map((instance) => (updated.id === instance.id ? updated : instance));
    this.patchState({ instances });
  }

  selectInstance(instanceId: string): void {
    this.patchState({ selectedInstanceId: instanceId });
    const instances = this.instances();
    const selectedInstance = instances?.find((instance) => instance.id === instanceId);
    if (!selectedInstance?.id) {
      this.resetInstance();
      return;
    }
    const oldSelectedInstance = this.selectedInstance();
    if (!selectedInstance || isEqual(selectedInstance, oldSelectedInstance)) {
      return;
    }

    this.patchState({ selectedInstance });
  }

  resetInstance(): void {
    this.patchState({ selectedInstance: null });
  }
}
