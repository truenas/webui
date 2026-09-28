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

  /**
   * Loads the datasets, entering the loading state while `pool.dataset.details` runs.
   * For loads the user asked for, where the page should show that it is fetching.
   */
  readonly loadDatasets = (): void => {
    this.fetchDatasets({ silent: false });
  };

  /**
   * Refetches the datasets without entering the loading state, so the tree and the
   * details panel stay mounted while it runs — for refreshes the user did not ask for,
   * where `loadDatasets` would blank the page. A failure keeps the data already shown
   * rather than replacing it with an error.
   */
  readonly refreshDatasets = (): void => {
    this.fetchDatasets({ silent: true });
  };

  /**
   * The one stream both kinds of fetch go through, so the latest request always wins.
   *
   * As two effects with a `switchMap` each, neither cancelled the other: an older
   * response could land after a newer one and put back a snapshot from before, say, a
   * dataset was deleted. Any answer clears `isLoading`, because a refresh can cancel a
   * load that set it, and nothing else would clear it then.
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
        return this.api.call('pool.dataset.details')
          .pipe(
            tap((datasets: DatasetDetails[]) => {
              this.patchState({
                isLoading: false,
                datasets,
              });
            }),
            catchError((error: unknown) => {
              if (!silent) {
                this.patchState({ isLoading: false, error });
              } else if (this.get().isLoading) {
                // This refresh cancelled a load; end its loading state, keep what is shown.
                this.patchState({ isLoading: false });
              }

              return EMPTY;
            }),
          );
      }),
    );
  });

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
