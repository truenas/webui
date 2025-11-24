import { computed, Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { isEqual } from 'lodash-es';
import {
  of, switchMap, tap, EMPTY,
} from 'rxjs';
import {
  catchError, filter, map, startWith, distinctUntilChanged,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEventTyped } from 'app/interfaces/api-message.interface';
import { ContainerInstance, ContainerMetrics } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface ContainersState {
  isLoading: boolean;
  containers: ContainerInstance[] | undefined;
  selectedContainerId: number | null;
  selectedContainer: ContainerInstance | undefined;
  metrics: ContainerMetrics;
}

const initialState: ContainersState = {
  isLoading: true,
  containers: undefined,
  selectedContainerId: null,
  selectedContainer: undefined,
  metrics: {},
};

@UntilDestroy()
@Injectable()
export class ContainersStore extends ComponentStore<ContainersState> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly selectedContainer = computed(() => this.state().selectedContainer);
  readonly selectedContainerId = computed(() => this.state().selectedContainerId);
  readonly containers = computed(() => {
    return this.state().containers?.filter((container) => !!container) ?? [];
  });

  readonly metrics = computed(() => this.state().metrics);

  constructor() {
    super(initialState);
    this.listenForMetrics();
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        return this.api.call('container.query').pipe(
          tap((containers) => {
            const selectedContainerId = this.selectedContainerId();

            if (selectedContainerId) {
              const updatedSelectedContainer = containers.find((container) => container.id === selectedContainerId);
              if (updatedSelectedContainer) {
                this.patchState({ selectedContainer: updatedSelectedContainer });
              } else if (containers.length) {
                this.router.navigate(['/containers', 'view', containers[0].id]);
              } else {
                this.router.navigate(['/containers']);
              }
            } else if (containers.length) {
              this.router.navigate(['/containers', 'view', containers[0].id]);
            }
          }),
          tap((containers) => {
            this.patchState({
              containers,
              isLoading: false,
            });
          }),
          switchMap(() => {
            return this.api.subscribe('container.query').pipe(
              tap((event) => this.processContainerUpdateEvent(event)),
            );
          }),
          catchError((error: unknown) => {
            this.patchState({ isLoading: false, containers: [] });
            this.errorHandler.showErrorModal(error);
            return of(undefined);
          }),
        );
      }),
      untilDestroyed(this),
    );
  });

  private processContainerUpdateEvent(
    event: ApiEventTyped<'container.query'>,
  ): void {
    const prevContainers = this.containers();
    const selectedContainer = this.selectedContainer();
    switch (event?.msg) {
      case CollectionChangeType.Added:
        this.patchState({ containers: [...prevContainers, event.fields] });
        break;
      case CollectionChangeType.Changed: {
        // TODO: Keep it until API improvements
        // Workaround for API limitation: When only the status field is updated,
        // the API sends event.id as the container name (string) instead of the container ID (number).
        // This special handling matches by name until the API is fixed to consistently use IDs.
        // Once the API improvement is made, this workaround can be removed and only the standard
        // ID-based update (below) will be needed.
        const isStatusOnlyUpdate = event.fields && Object.keys(event.fields).length === 1 && 'status' in event.fields;
        let updatedContainers: ContainerInstance[];

        if (isStatusOnlyUpdate) {
          updatedContainers = prevContainers.map((container) => {
            if (container.name === event.id) {
              return { ...container, status: event.fields.status };
            }
            return container;
          });
        } else {
          updatedContainers = prevContainers.map(
            (container) => (container.id === event.id ? { ...container, ...event?.fields } : container),
          );
        }

        const updates: Partial<ContainersState> = { containers: updatedContainers };

        // Update selectedContainer if it was affected
        if (selectedContainer) {
          const matchesByName = isStatusOnlyUpdate && selectedContainer.name === event.id;
          const matchesById = selectedContainer.id === event.id;
          if (matchesByName || matchesById) {
            updates.selectedContainer = updatedContainers.find(
              (container) => container.id === selectedContainer.id,
            );
          }
        }

        this.patchState(updates);
        break;
      }
      case CollectionChangeType.Removed:
        this.patchState({ containers: prevContainers.filter((container) => container.id !== event.id) });
        break;
    }
  }

  containerUpdated(updated: ContainerInstance): void {
    const containers = this.containers().map((container) => (updated.id === container.id ? updated : container));
    const updates: Partial<ContainersState> = { containers };

    if (this.selectedContainer()?.id === updated.id) {
      updates.selectedContainer = updated;
    }

    this.patchState(updates);
  }

  selectContainer(containerId: number): void {
    this.patchState({ selectedContainerId: containerId });
    const containers = this.containers();
    const selectedContainer = containers?.find((container) => container.id === containerId);
    if (!selectedContainer?.id) {
      this.resetContainer();
      return;
    }
    const oldSelectedContainer = this.selectedContainer();
    if (!selectedContainer || isEqual(selectedContainer, oldSelectedContainer)) {
      return;
    }

    this.patchState({ selectedContainer });
  }

  resetContainer(): void {
    this.patchState({ selectedContainer: null });
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
          // Note: Backend API still uses legacy 'virt.instance.metrics' endpoint.
          // This will be updated when the backend migrates to 'container.metrics'.
          return this.api.subscribe('virt.instance.metrics').pipe(
            map((event) => event.fields ?? {}),
          );
        }),
        tap((metrics) => this.patchState({ metrics })),
        catchError(() => EMPTY),
      )),
      untilDestroyed(this),
    );
  });
}
