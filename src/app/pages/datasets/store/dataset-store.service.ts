import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, map, switchMap, tap,
} from 'rxjs/operators';
import { Dataset, DatasetDetails } from 'app/interfaces/dataset.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';
import { WebSocketService } from 'app/services';

export interface DatasetTreeState {
  isLoading: boolean;
  error: WebsocketError | null;
  datasets: DatasetDetails[];
  selectedDatasetId: string | null;
  isLoadingDatasetFull: boolean;
  selectedDatasetFull: Dataset | null;
  errorDatasetFull: WebsocketError | null;
}

const initialState: DatasetTreeState = {
  isLoading: false,
  error: null,
  datasets: [],
  selectedDatasetId: null,
  isLoadingDatasetFull: false,
  errorDatasetFull: null,
  selectedDatasetFull: null,
};

@Injectable()
export class DatasetTreeStore extends ComponentStore<DatasetTreeState> {
  readonly isLoading$ = this.select((state) => state.isLoading);
  // TODO
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

  readonly selectedDataset$ = this.select(
    this.selectedBranch$,
    (selectedBranch) => (selectedBranch ? selectedBranch[selectedBranch.length - 1] : null),
  );

  readonly selectedParentDataset$ = this.select(
    this.selectedBranch$,
    (selectedBranch) => (selectedBranch ? selectedBranch[selectedBranch.length - 2] : null),
  );

  readonly selectedDatasetId$ = this.select((state) => state.selectedDatasetId);
  readonly isLoadingDatasetFull$ = this.select((state) => state.isLoadingDatasetFull);
  readonly errorDatasetFull$ = this.select((state) => state.errorDatasetFull);
  readonly selectedDatasetFull$ = this.select((state) => state.selectedDatasetFull);

  readonly loadDataset = this.effect((selectedDatasetId$: Observable<string>) => {
    return selectedDatasetId$.pipe(
      tap(() => {
        this.patchState({
          isLoadingDatasetFull: true,
          errorDatasetFull: null,
        });
      }),
      switchMap((datasetId) => {
        return this.ws.call('pool.dataset.query', [[['id', '=', datasetId]], { extra: { retrieve_children: false } }]).pipe(
          map((datasets) => datasets[0]),
          tap((dataset: Dataset) => {
            this.patchState({
              isLoadingDatasetFull: false,
              selectedDatasetFull: dataset,
            });
          }),
          catchError((error) => {
            this.patchState({
              isLoadingDatasetFull: false,
              errorDatasetFull: error,
            });

            return EMPTY;
          }),
        );
      }),
    );
  });

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
        return this.ws.call('pool.dataset.details')
          .pipe(
            tap((datasets: DatasetDetails[]) => {
              this.patchState({
                isLoading: false,
                datasets,
              });
            }),
            catchError((error) => {
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

  constructor(
    private ws: WebSocketService,
  ) {
    super(initialState);
  }
}
