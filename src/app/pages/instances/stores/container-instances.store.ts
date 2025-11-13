import { computed, Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { isEqual } from 'lodash-es';
import {
  of, Subject, switchMap, tap, EMPTY,
} from 'rxjs';
import {
  catchError, takeUntil, filter, map, startWith, distinctUntilChanged,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEventTyped } from 'app/interfaces/api-message.interface';
import { ContainerInstance, ContainerMetrics } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface ContainerInstancesState {
  isLoading: boolean;
  instances: ContainerInstance[] | undefined;
  selectedInstanceId: number | null;
  selectedInstance: ContainerInstance | undefined;
  metrics: ContainerMetrics;
}

const initialState: ContainerInstancesState = {
  isLoading: true,
  instances: undefined,
  selectedInstanceId: null,
  selectedInstance: undefined,
  metrics: {},
};

@UntilDestroy()
@Injectable()
export class ContainerInstancesStore extends ComponentStore<ContainerInstancesState> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly selectedInstance = computed(() => this.state().selectedInstance);
  readonly selectedInstanceId = computed(() => this.state().selectedInstanceId);
  readonly instances = computed(() => {
    return this.state().instances?.filter((instance) => !!instance) ?? [];
  });

  readonly metrics = computed(() => this.state().metrics);

  private readonly destroySubscription$ = new Subject<void>();

  constructor() {
    super(initialState);
    this.listenForMetrics();
  }

  readonly initialize = this.effect((trigger$) => {
    this.destroySubscription$.next();
    return trigger$.pipe(
      switchMap(() => {
        return this.api.call('container.query').pipe(
          tap((instances) => {
            const selectedInstanceId = this.selectedInstanceId();

            if (selectedInstanceId) {
              const updatedSelectedInstance = instances.find((instance) => instance.id === selectedInstanceId);
              if (updatedSelectedInstance) {
                this.patchState({ selectedInstance: updatedSelectedInstance });
              } else if (instances.length) {
                this.router.navigate(['/containers', 'view', instances[0].id]);
              } else {
                this.router.navigate(['/containers']);
              }
            } else if (instances.length) {
              this.router.navigate(['/containers', 'view', instances[0].id]);
            }
          }),
          tap((instances) => {
            this.patchState({
              instances,
              isLoading: false,
            });
          }),
          switchMap(() => {
            return this.api.subscribe('container.query').pipe(
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
    event: ApiEventTyped<'container.query'>,
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

  instanceUpdated(updated: ContainerInstance): void {
    const instances = this.instances().map((instance) => (updated.id === instance.id ? updated : instance));
    const updates: Partial<ContainerInstancesState> = { instances };

    if (this.selectedInstance()?.id === updated.id) {
      updates.selectedInstance = updated;
    }

    this.patchState(updates);
  }

  selectInstance(instanceId: number): void {
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

  private readonly listenForMetrics = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => this.router.events.pipe(
        startWith(null),
        filter((event): event is NavigationEnd | null => !event || event instanceof NavigationEnd),
        map((event) => (event ? event.urlAfterRedirects : this.router.url)),
        map((url) => url.includes('/containers/view')),
        distinctUntilChanged(),
        switchMap((shouldSubscribe) => {
          if (!shouldSubscribe) {
            return EMPTY;
          }
          // TODO: API endpoint under review - may be migrated to container.metrics
          // Currently using virt.instance.metrics for container metrics.
          // API ticket will determine if this should move to container.* endpoint.
          return this.api.subscribe('virt.instance.metrics').pipe(
            map((event) => event.fields),
          );
        }),
        tap((metrics) => this.patchState({ metrics })),
        catchError(() => EMPTY),
      )),
      untilDestroyed(this),
    );
  });
}
