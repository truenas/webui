import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, switchMap, tap,
} from 'rxjs/operators';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';

export interface DatasetTreeState {
  isLoading: boolean;
  error: unknown;
  datasets: DatasetDetails[];
  selectedDatasetId: string | null;
}

const initialState: DatasetTreeState = {
  isLoading: false,
  error: null,
  datasets: [],
  selectedDatasetId: null,
};

@Injectable({
  providedIn: 'root',
})
export class DatasetTreeStore extends ComponentStore<DatasetTreeState> {
  private api = inject(ApiService);

  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly error$ = this.select((state) => state.error);
  readonly datasets$ = this.select((state) => state.datasets);
  readonly selectedBranch$ = this.select((state) => {
    if (!state.selectedDatasetId) {
      return null;
    }

    const selectedBranch = getTreeBranchToNode(state.datasets, (dataset) => dataset.id === state.selectedDatasetId);
    if (!selectedBranch) {
      return null;
    }

    return selectedBranch;
  });

  /**
   * details for the currently selected dataset in the menu.
   * will be `null` if nothing is currently selected *or* if the store is
   * awaiting `pool.dataset.details` to finish with updated information.
   */
  readonly selectedDataset$ = this.select(
    this.selectedBranch$,
    this.isLoading$,
    (selectedBranch, isLoading) => {
      if (isLoading) {
        return null;
      }
      return selectedBranch ? selectedBranch[selectedBranch.length - 1] : null;
    },
  );

  /**
   * details for the immediate parent of `selectedDataset$` in the menu.
   */
  readonly selectedParentDataset$ = this.select(
    this.selectedBranch$,
    this.isLoading$,
    (selectedBranch, isLoading) => {
      if (isLoading) {
        return null;
      }
      return selectedBranch ? selectedBranch[selectedBranch.length - 2] : null;
    },
  );

  /** Whether a `pool.dataset.details` call is in flight. */
  private isFetching = false;
  /** Whether a refresh arrived during that call and still has to run once it answers. */
  private isRefreshQueued = false;

  /**
   * Loads the datasets, entering the loading state while `pool.dataset.details` runs.
   * For loads the user asked for, where the page should show that it is fetching.
   * Cancels whatever fetch is in flight, so the latest load always wins.
   */
  readonly loadDatasets = (): void => {
    this.fetchDatasets({ silent: false });
  };

  /**
   * Refetches the datasets without entering the loading state, so the tree and the
   * details panel stay mounted while it runs — for refreshes the user did not ask for,
   * where `loadDatasets` would blank the page.
   *
   * A refresh never cancels a fetch in flight. It waits for that one to answer and then
   * runs once, however many arrived meanwhile — so a burst of them cannot keep restarting
   * `pool.dataset.details` (the heaviest dataset call there is) and starve the page, and a
   * load the user is waiting on is never thrown away for one they did not ask for.
   */
  readonly refreshDatasets = (): void => {
    if (this.isFetching) {
      this.isRefreshQueued = true;
      return;
    }
    this.fetchDatasets({ silent: true });
  };

  /**
   * The one stream both kinds of fetch go through.
   *
   * As two effects with a `switchMap` each, neither knew about the other: an older
   * response could land after a newer one and put back a snapshot from before, say, a
   * dataset was deleted. Here a load cancels what is in flight, and a refresh queues
   * behind it (see `refreshDatasets`), so answers are applied in the order they were
   * asked for.
   */
  private readonly fetchDatasets = this.effect((triggers$: Observable<{ silent: boolean }>) => {
    return triggers$.pipe(
      tap(({ silent }) => {
        if (!silent) {
          // Not clearing the state on reload on purpose.
          this.patchState({
            error: null,
            isLoading: true,
          });
        }
      }),
      switchMap(({ silent }) => {
        this.isFetching = true;
        if (!silent) {
          // This load fetches fresher data than any refresh queued before it could.
          this.isRefreshQueued = false;
        }

        return this.api.call('pool.dataset.details')
          .pipe(
            tap((datasets: DatasetDetails[]) => {
              // `error` too: a refresh never passes through the branch above that clears
              // it, so a failed load followed by a good refresh would otherwise leave the
              // page reporting a failure over data that loaded fine.
              this.patchState({
                isLoading: false,
                error: null,
                datasets,
              });
              this.onFetchSettled();
            }),
            catchError((error: unknown) => {
              if (!silent) {
                this.patchState({ isLoading: false, error });
              } else if (!this.get().datasets.length) {
                // A failed refresh keeps the data already shown rather than replacing it
                // with an error. With nothing shown there is nothing to keep, and staying
                // quiet would tell the user there are no datasets.
                this.patchState({ error });
              }
              this.onFetchSettled();

              return EMPTY;
            }),
          );
      }),
    );
  });

  /** Runs the refresh that was queued behind the fetch that just answered, if there was one. */
  private onFetchSettled(): void {
    this.isFetching = false;
    if (this.isRefreshQueued) {
      this.isRefreshQueued = false;
      this.fetchDatasets({ silent: true });
    }
  }

  readonly resetDatasets = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          isLoading: false,
          selectedDatasetId: null,
          datasets: [],
        });
      }),
    );
  });

  readonly datasetUpdated = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => this.loadDatasets()),
    );
  });

  readonly selectDatasetById = this.updater((state, selectedDatasetId: string) => {
    return {
      ...state,
      selectedDatasetId,
    };
  });

  constructor() {
    super(initialState);
  }
}
