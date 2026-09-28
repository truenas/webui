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

  readonly loadDatasets = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        // Not clearing the state on reload on purpose.
        this.patchState({
          error: null,
          isLoading: true,
        });
      }),
      switchMap(() => {
        return this.api.call('pool.dataset.details')
          .pipe(
            tap((datasets: DatasetDetails[]) => {
              this.patchState({
                isLoading: false,
                datasets,
              });
            }),
            catchError((error: unknown) => {
              this.patchState({
                isLoading: false,
                error,
              });

              return EMPTY;
            }),
          );
      }),
    );
  });

  /**
   * Refetches the datasets without entering the loading state, so the tree and the
   * details panel stay mounted while it runs — for refreshes the user did not ask for,
   * where `loadDatasets` would blank the page. A failure keeps the data already shown
   * rather than replacing it with an error.
   */
  readonly refreshDatasets = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      switchMap(() => {
        return this.api.call('pool.dataset.details').pipe(
          tap((datasets: DatasetDetails[]) => this.patchState({ datasets })),
          catchError(() => EMPTY),
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
