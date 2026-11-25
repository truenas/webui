import { Injectable, computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';
import { toDatasetDetails } from 'app/services/dataset/webui-dataset-details.utils';

export interface DatasetTreeState {
  isLoading: boolean;
  error: unknown;
  datasets: DatasetDetails[];
  selectedDatasetId: string | null;
  /** A dataset or zvol just created, for the page to open once the reload that brings it into the tree answers. */
  pendingSelectionId: string | null;
}

const initialState: DatasetTreeState = {
  isLoading: false,
  error: null,
  datasets: [],
  selectedDatasetId: null,
  pendingSelectionId: null,
};

@Injectable({
  providedIn: 'root',
})
export class DatasetTreeStore {
  private api = inject(ApiService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly error = this.state.error;
  readonly datasets = this.state.datasets;
  readonly pendingSelectionId = this.state.pendingSelectionId;

  /** The selected dataset and its ancestors, root first; `null` when nothing is selected or it isn't in the tree. */
  readonly selectedBranch = computed<DatasetDetails[] | null>(() => {
    const selectedDatasetId = this.state.selectedDatasetId();
    if (!selectedDatasetId) {
      return null;
    }

    return getTreeBranchToNode(this.state.datasets(), (dataset) => dataset.id === selectedDatasetId) || null;
  });

  /**
   * details for the currently selected dataset in the menu.
   * will be `null` if nothing is currently selected *or* if the store is
   * awaiting `webui.dataset.details` to finish with updated information.
   */
  readonly selectedDataset = computed<DatasetDetails | null>(() => {
    const selectedBranch = this.selectedBranch();
    if (this.state.isLoading() || !selectedBranch) {
      return null;
    }
    return selectedBranch[selectedBranch.length - 1];
  });

  /**
   * details for the immediate parent of `selectedDataset` in the menu.
   */
  readonly selectedParentDataset = computed<DatasetDetails | null>(() => {
    const selectedBranch = this.selectedBranch();
    if (this.state.isLoading() || !selectedBranch) {
      return null;
    }
    return selectedBranch[selectedBranch.length - 2] ?? null;
  });

  /** Whether a `webui.dataset.details` call is in flight. */
  private isFetching = false;
  /** Whether a refresh arrived during that call and still has to run once it answers. */
  private isRefreshQueued = false;

  /**
   * The one stream both kinds of fetch go through.
   *
   * As two effects with a `switchMap` each, neither knew about the other: an older
   * response could land after a newer one and put back a snapshot from before, say, a
   * dataset was deleted. Here a load cancels what is in flight, and a refresh queues
   * behind it (see `refreshDatasets`), so answers are applied in the order they were
   * asked for.
   */
  private readonly fetchDatasets = rxMethod<{ silent: boolean }>(pipe(
    tap(({ silent }) => {
      if (!silent) {
        // Not clearing the state on reload on purpose.
        patchState(this.state, { error: null, isLoading: true });
      }
    }),
    switchMap(({ silent }) => {
      // A refresh queued behind the fetch this one replaces stays queued. A load does
      // not stand in for it: what the refresh was asked to pick up may not be in
      // `webui.dataset.details` yet when the load is answered.
      this.isFetching = true;

      return this.api.call('webui.dataset.details').pipe(
        map(toDatasetDetails),
        tapResponse({
          next: (datasets) => {
            // `error` too: a refresh never passes through the branch above that clears
            // it, so a failed load followed by a good refresh would otherwise leave the
            // page reporting a failure over data that loaded fine.
            patchState(this.state, { isLoading: false, error: null, datasets });
            this.onFetchSettled();
          },
          error: (error: unknown) => {
            if (!silent) {
              patchState(this.state, { isLoading: false, error });
            } else if (!this.state.datasets().length) {
              // A failed refresh keeps the data already shown rather than replacing it
              // with an error. With nothing shown there is nothing to keep, and staying
              // quiet would tell the user there are no datasets.
              patchState(this.state, { error });
            }
            this.onFetchSettled();
          },
        }),
      );
    }),
  ));

  /**
   * Loads the datasets, entering the loading state while `webui.dataset.details` runs.
   * For loads the user asked for, where the page should show that it is fetching.
   * Cancels whatever fetch is in flight, so the latest load always wins.
   */
  loadDatasets(): void {
    this.fetchDatasets({ silent: false });
  }

  /**
   * Refetches without entering the loading state, so the tree and details stay mounted, for refreshes
   * the user didn't ask for. It never cancels a fetch in flight: it runs once after it, however many
   * arrived, so a burst can't keep restarting `webui.dataset.details` or discard a load the user awaits.
   * An unanswered fetch leaves refreshes queued until the next `loadDatasets`.
   */
  refreshDatasets(): void {
    if (this.isFetching) {
      this.isRefreshQueued = true;
      return;
    }
    this.fetchDatasets({ silent: true });
  }

  resetDatasets(): void {
    patchState(this.state, {
      isLoading: false,
      selectedDatasetId: null,
      pendingSelectionId: null,
      datasets: [],
    });
  }

  datasetUpdated(): void {
    this.loadDatasets();
  }

  /**
   * Reloads the datasets and marks `id` for the page to open once they arrive. The page holding the
   * selection, not the details panel, has to act on it: the reload unmounts the panel.
   */
  datasetCreated(id: string): void {
    patchState(this.state, { pendingSelectionId: id });
    this.loadDatasets();
  }

  clearPendingSelection(): void {
    patchState(this.state, { pendingSelectionId: null });
  }

  selectDatasetById(selectedDatasetId: string): void {
    patchState(this.state, { selectedDatasetId });
  }

  /** Runs the refresh that was queued behind the fetch that just answered, if there was one. */
  private onFetchSettled(): void {
    this.isFetching = false;
    if (this.isRefreshQueued) {
      this.isRefreshQueued = false;
      this.fetchDatasets({ silent: true });
    }
  }
}
