import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, switchMap, tap,
} from 'rxjs/operators';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { getDatasetAndParentsById } from 'app/pages/datasets/utils/get-datasets-in-tree-by-id.utils';
import { WebSocketService } from 'app/services';

export interface DatasetTreeState {
  isLoading: boolean;
  isLoadingDetails: boolean;
  error: WebsocketError | null;
  errorDetails: WebsocketError | null;
  datasets: DatasetDetails[];
  datasetDetails: DatasetDetails[];
  selectedDatasetId: string | null;
}

const initialState: DatasetTreeState = {
  isLoading: false,
  isLoadingDetails: false,
  error: null,
  errorDetails: null,
  datasets: [],
  datasetDetails: [],
  selectedDatasetId: null,
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

    const selectedBranch = getDatasetAndParentsById(state.datasets, state.selectedDatasetId);
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

  readonly selectedDatasetDetails$ = this.select((state) => {
    const selectedBranch = getDatasetAndParentsById(state.datasets, state.selectedDatasetId);
    if (!selectedBranch) {
      return null;
    }
    return state.datasetDetails.find((details) => details.pool === selectedBranch[selectedBranch.length - 1].pool);
  });

  readonly loadDatasets = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
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

  readonly loadDatasetDetails = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          errorDetails: null,
          isLoadingDetails: true,
        });
      }),
      switchMap(() => {
        return this.ws.call('pool.dataset.details').pipe(
          tap((datasetDetails: DatasetDetails[]) => {
            this.patchState({
              isLoadingDetails: false,
              datasetDetails,
            });
          }),
          catchError((errorDetails) => {
            this.patchState({
              isLoadingDetails: false,
              errorDetails,
            });

            return EMPTY;
          }),
        );
      }),
    );
  });

  readonly datasetUpdated = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.loadDatasets();
        this.loadDatasetDetails();
      }),
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
