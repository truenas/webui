import { computed, DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  EMPTY, exhaustMap, pipe,
} from 'rxjs';
import {
  catchError, filter, map, startWith, distinctUntilChanged, switchMap,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { containerStatusLabels } from 'app/enums/container.enum';
import { Container, ContainerMetrics, toContainer } from 'app/interfaces/container.interface';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * A `container.query` event as middleware sends it. The generated event declares a numeric `id`
 * and a whole row, but a status-only change arrives keyed by the container's name and carrying
 * only `status` (see the workaround in `processContainerUpdateEvent`).
 */
type ContainerQueryEvent
  = | { msg: CollectionChangeType.Added; id: number; fields: Container }
    | { msg: CollectionChangeType.Changed; id: number | string; fields: Partial<Container> }
    | { msg: CollectionChangeType.Removed; id: number };

export enum ContainerSortField {
  Name = 'name',
  Status = 'status',
  Autostart = 'autostart',
}

export interface ContainerSort {
  active: ContainerSortField;
  direction: SortDirection;
}

function compareContainerNames(a: Container, b: Container): number {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}

// Sort Status by the label the user actually sees (the translated status), not the raw
// enum, so the column stays alphabetical in non-English locales too.
function statusLabel(container: Container, translate: TranslateService): string {
  const state = container.status?.state;
  const label = state ? containerStatusLabels.get(state) : undefined;
  return translate.instant(label ?? state ?? '');
}

// Sorting is done client-side, mirroring the Installed Apps list (which sorts its
// in-memory list rather than relying on the backend to order the query response).
// `getStatusLabel` is a memoized resolver so each container's translated status is computed
// once per sort rather than twice on every O(n log n) comparison.
function compareContainers(
  a: Container,
  b: Container,
  sort: ContainerSort,
  getStatusLabel: (container: Container) => string,
): number {
  const modifier = sort.direction === SortDirection.Desc ? -1 : 1;
  let result: number;

  switch (sort.active) {
    case ContainerSortField.Status:
      result = getStatusLabel(a).localeCompare(getStatusLabel(b));
      break;
    case ContainerSortField.Autostart:
      result = Number(a.autostart) - Number(b.autostart);
      break;
    default:
      result = compareContainerNames(a, b);
      break;
  }

  // Apply the direction to the primary comparison only. The name tie-break below stays
  // ascending regardless of primary direction, so equal-status rows keep a stable A→Z
  // secondary order instead of getting reversed when sorting Status/Autostart descending.
  result *= modifier;

  // Stable, predictable ordering: break ties on name.
  if (result === 0 && sort.active !== ContainerSortField.Name) {
    result = compareContainerNames(a, b);
  }

  return result;
}

export interface ContainersState {
  isLoading: boolean;
  containers: Container[] | undefined;
  selectedContainerId: number | null;
  selectedContainer: Container | undefined;
  metrics: ContainerMetrics;
  sort: ContainerSort;
}

const initialState: ContainersState = {
  isLoading: false,
  containers: undefined,
  selectedContainerId: null,
  selectedContainer: undefined,
  metrics: {},
  sort: { active: ContainerSortField.Name, direction: SortDirection.Asc },
};

@Injectable()
export class ContainersStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly selectedContainer = this.state.selectedContainer;
  readonly selectedContainerId = this.state.selectedContainerId;
  readonly sort = this.state.sort;
  readonly metrics = this.state.metrics;
  readonly containers = computed(() => {
    const sort = this.sort();
    // Cache each container's translated status label so it is resolved once per sort
    // instead of on every comparison.
    const labelCache = new Map<Container, string>();
    const getStatusLabel = (container: Container): string => {
      let label = labelCache.get(container);
      if (label === undefined) {
        label = statusLabel(container, this.translate);
        labelCache.set(container, label);
      }
      return label;
    };
    // `state.containers` is its own signal, so frequent metrics patches do not re-run this sort.
    return (this.state.containers()?.filter((container) => !!container) ?? [])
      .sort((a, b) => compareContainers(a, b, sort, getStatusLabel));
  });

  /**
   * Returns true if containers have been loaded at least once.
   * Use this to differentiate between "not loaded yet" (hasLoaded=false, containers=[])
   * and "loaded with no data" (hasLoaded=true, containers=[]).
   */
  readonly hasLoaded = computed(() => this.state.containers() !== undefined);

  constructor() {
    this.listenForMetrics();
    this.subscribeToContainerUpdates();
  }

  readonly initialize = rxMethod<void>(pipe(
    // exhaustMap ignores new triggers while a request is in progress,
    // preventing duplicate API calls during rapid navigation
    exhaustMap(() => {
      // Skip if already loading (e.g. a reload() is in flight)
      if (this.state.isLoading()) {
        return EMPTY;
      }

      patchState(this.state, { isLoading: true });
      return this.api.query('container.query').pipe(
        map((containers) => containers.map(toContainer)),
        tapResponse({
          next: (containers) => {
            const selectedContainerId = this.selectedContainerId();

            if (selectedContainerId && Number.isFinite(selectedContainerId)) {
              const updatedSelectedContainer = containers.find((container) => container.id === selectedContainerId);
              if (updatedSelectedContainer) {
                patchState(this.state, { selectedContainer: updatedSelectedContainer });
              } else if (containers.length) {
                this.router.navigate(['/containers', 'view', containers[0].id]);
              } else {
                this.router.navigate(['/containers']);
              }
            } else if (containers.length) {
              this.router.navigate(['/containers', 'view', containers[0].id]);
            }

            patchState(this.state, { containers });
          },
          error: (error: unknown) => {
            patchState(this.state, { containers: [] });
            this.errorHandler.showErrorModal(error);
          },
          finalize: () => patchState(this.state, { isLoading: false }),
        }),
      );
    }),
  ));

  private subscribeToContainerUpdates(): void {
    this.api.subscribe('container.query')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.processContainerUpdateEvent(event as ContainerQueryEvent));
  }

  /**
   * Force reload containers, bypassing the initialization check.
   * Use this after container creation/update operations.
   */
  readonly reload = rxMethod<void>(pipe(
    exhaustMap(() => {
      patchState(this.state, { isLoading: true });
      return this.api.query('container.query').pipe(
        map((containers) => containers.map(toContainer)),
        tapResponse({
          next: (containers) => {
            const selectedContainerId = this.selectedContainerId();
            const updates: Partial<ContainersState> = { containers };

            if (selectedContainerId) {
              const updatedSelectedContainer = containers.find((container) => container.id === selectedContainerId);
              if (updatedSelectedContainer) {
                updates.selectedContainer = updatedSelectedContainer;
              }
            }

            patchState(this.state, updates);
          },
          error: (error: unknown) => this.errorHandler.showErrorModal(error),
          finalize: () => patchState(this.state, { isLoading: false }),
        }),
      );
    }),
  ));

  private processContainerUpdateEvent(event: ContainerQueryEvent): void {
    const prevContainers = this.containers();
    const selectedContainer = this.selectedContainer();
    switch (event?.msg) {
      case CollectionChangeType.Added:
        patchState(this.state, { containers: [...prevContainers, event.fields] });
        break;
      case CollectionChangeType.Changed: {
        // TODO(NAS-XXXXX): remove once middleware always sends container IDs. A status-only update sends
        // the container name as `event.id`, so it is matched by name; containers sharing a name could
        // be updated wrongly.
        const isStatusOnlyUpdate = event.fields && Object.keys(event.fields).length === 1 && 'status' in event.fields;
        let updatedContainers: Container[];

        if (isStatusOnlyUpdate) {
          // Check for duplicate container names before using name-based matching
          const containerNames = prevContainers.map((container) => container.name);
          const hasDuplicates = containerNames.some((name, index) => containerNames.indexOf(name) !== index);
          if (hasDuplicates) {
            console.error('[ContainersStore] Duplicate container names detected - name-based status update may be unreliable');
          }

          console.warn('[ContainersStore] Using name-based workaround for status update', { containerId: event.id });

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

        patchState(this.state, updates);
        break;
      }
      case CollectionChangeType.Removed:
        patchState(this.state, { containers: prevContainers.filter((container) => container.id !== event.id) });
        break;
    }
  }

  /**
   * Update the sort order. The `containers` selector re-sorts client-side immediately, so live
   * add/change events stay ordered and no reload is needed.
   */
  setSort(sort: ContainerSort): void {
    patchState(this.state, { sort });
  }

  containerUpdated(updated: Container): void {
    const containers = this.containers().map((container) => (updated.id === container.id ? updated : container));
    const updates: Partial<ContainersState> = { containers };

    if (this.selectedContainer()?.id === updated.id) {
      updates.selectedContainer = updated;
    }

    patchState(this.state, updates);
  }

  selectContainer(containerId: number): void {
    patchState(this.state, { selectedContainerId: containerId });

    // If containers aren't loaded yet, just save the ID and let initialize() handle it
    if (this.state.containers() === undefined) {
      return;
    }

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

    patchState(this.state, { selectedContainer });
  }

  resetContainer(): void {
    patchState(this.state, { selectedContainer: null });
  }

  private listenForMetrics(): void {
    this.router.events.pipe(
      startWith(null),
      filter((event): event is NavigationEnd | null => !event || event instanceof NavigationEnd),
      map((event) => (event ? event.urlAfterRedirects : this.router.url)),
      map((url) => url.includes('/containers/view')),
      distinctUntilChanged(),
      switchMap((shouldSubscribe) => {
        if (!shouldSubscribe) {
          return EMPTY;
        }
        return this.api.subscribe('container.metrics').pipe(
          // Generated as a dictionary of `unknown`; the UI's `ContainerStats` names what it reads.
          map((event) => (event.msg === 'added' ? event.fields as unknown as ContainerMetrics : null)),
          filter((metrics) => metrics !== null),
        );
      }),
      catchError(() => EMPTY),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((metrics) => patchState(this.state, { metrics }));
  }
}
