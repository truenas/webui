import { computed, DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  of, exhaustMap, tap, EMPTY,
} from 'rxjs';
import {
  catchError, filter, map, startWith, distinctUntilChanged, switchMap,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { containerStatusLabels } from 'app/enums/container.enum';
import { ApiEventTyped } from 'app/interfaces/api-message.interface';
import { Container, ContainerMetrics } from 'app/interfaces/container.interface';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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
function compareContainers(a: Container, b: Container, sort: ContainerSort, translate: TranslateService): number {
  const modifier = sort.direction === SortDirection.Desc ? -1 : 1;
  let result: number;

  switch (sort.active) {
    case ContainerSortField.Status:
      result = statusLabel(a, translate).localeCompare(statusLabel(b, translate));
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
export class ContainersStore extends ComponentStore<ContainersState> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly selectedContainer = computed(() => this.state().selectedContainer);
  readonly selectedContainerId = computed(() => this.state().selectedContainerId);
  readonly sort = computed(() => this.state().sort);
  // Read the raw list through its own computed so the expensive sort below only re-runs when the
  // list or sort actually change. Frequent metrics patches keep the same `containers`/`sort`
  // references, so this computed's dependencies stay stable and the sort is skipped on those ticks.
  private readonly rawContainers = computed(() => this.state().containers);
  readonly containers = computed(() => {
    const sort = this.sort();
    return (this.rawContainers()?.filter((container) => !!container) ?? [])
      .sort((a, b) => compareContainers(a, b, sort, this.translate));
  });

  /**
   * Returns true if containers have been loaded at least once.
   * Use this to differentiate between "not loaded yet" (hasLoaded=false, containers=[])
   * and "loaded with no data" (hasLoaded=true, containers=[]).
   */
  readonly hasLoaded = computed(() => this.state().containers !== undefined);

  readonly metrics = computed(() => this.state().metrics);

  constructor() {
    super(initialState);
    this.listenForMetrics();
    this.subscribeToContainerUpdates();
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      // exhaustMap ignores new triggers while a request is in progress,
      // preventing duplicate API calls during rapid navigation
      exhaustMap(() => {
        // Skip if already loading
        if (this.state().isLoading) {
          return EMPTY;
        }

        this.patchState({ isLoading: true });
        return this.api.call('container.query').pipe(
          tap((containers) => {
            const selectedContainerId = this.selectedContainerId();

            if (selectedContainerId && Number.isFinite(selectedContainerId)) {
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
          catchError((error: unknown) => {
            this.patchState({ isLoading: false, containers: [] });
            this.errorHandler.showErrorModal(error);
            return of(undefined);
          }),
        );
      }),
    );
  });

  private subscribeToContainerUpdates(): void {
    this.api.subscribe('container.query')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.processContainerUpdateEvent(event));
  }

  /**
   * Force reload containers, bypassing the initialization check.
   * Use this after container creation/update operations.
   */
  readonly reload = this.effect((trigger$) => {
    return trigger$.pipe(
      exhaustMap(() => {
        this.patchState({ isLoading: true });
        return this.api.call('container.query').pipe(
          tap((containers) => {
            const selectedContainerId = this.selectedContainerId();
            const updates: Partial<ContainersState> = {
              containers,
              isLoading: false,
            };

            if (selectedContainerId) {
              const updatedSelectedContainer = containers.find((container) => container.id === selectedContainerId);
              if (updatedSelectedContainer) {
                updates.selectedContainer = updatedSelectedContainer;
              }
            }

            this.patchState(updates);
          }),
          catchError((error: unknown) => {
            this.patchState({ isLoading: false });
            this.errorHandler.showErrorModal(error);
            return of(undefined);
          }),
        );
      }),
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
        // TODO(NAS-XXXXX): Remove this workaround once API is fixed to consistently use container IDs
        // Workaround for API limitation: When only the status field is updated,
        // the API sends event.id as the container name (string) instead of the container ID (number).
        // This special handling matches by name until the API is fixed to consistently use IDs.
        // Once the API improvement is made, this workaround can be removed and only the standard
        // ID-based update (below) will be needed.
        // Risk: Could cause bugs if containers have identical names or if API behavior changes unexpectedly.
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

        this.patchState(updates);
        break;
      }
      case CollectionChangeType.Removed:
        this.patchState({ containers: prevContainers.filter((container) => container.id !== event.id) });
        break;
    }
  }

  /**
   * Update the sort order. The `containers` selector re-sorts client-side immediately, so live
   * add/change events stay ordered and no reload is needed.
   */
  setSort(sort: ContainerSort): void {
    this.patchState({ sort });
  }

  containerUpdated(updated: Container): void {
    const containers = this.containers().map((container) => (updated.id === container.id ? updated : container));
    const updates: Partial<ContainersState> = { containers };

    if (this.selectedContainer()?.id === updated.id) {
      updates.selectedContainer = updated;
    }

    this.patchState(updates);
  }

  selectContainer(containerId: number): void {
    this.patchState({ selectedContainerId: containerId });

    // If containers aren't loaded yet, just save the ID and let initialize() handle it
    if (this.state().containers === undefined) {
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
          return this.api.subscribe('container.metrics').pipe(
            map((event) => event.fields ?? {}),
          );
        }),
        tap((metrics) => this.patchState({ metrics })),
        catchError(() => EMPTY),
      )),
      takeUntilDestroyed(this.destroyRef),
    );
  });
}
