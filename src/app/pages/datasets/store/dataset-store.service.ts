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
  error: WebsocketError | null;
  datasets: DatasetDetails[];
  selectedDatasetId: string | null;
}

const initialState: DatasetTreeState = {
  isLoading: false,
  error: null,
  datasets: [],
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
