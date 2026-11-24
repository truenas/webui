import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  datasetProperties, toZfsResourceCreate, toZfsResourceSet, ZfsResourceQuery, zfsResourceToDataset,
} from 'app/services/dataset/zfs-resource.utils';

export interface LoadDatasetOptions {
  /** Also read the dataset's immediate children, as `children`. */
  withChildren?: boolean;
}

/**
 * Reads and writes datasets and zvols through `zfs.resource`, in the `Dataset` / `DatasetCreate` / `DatasetUpdate`
 * shapes the storage pages are written against. See `zfs-resource.utils.ts` for the translation.
 */
@Injectable({ providedIn: 'root' })
export class DatasetApiService {
  private api = inject(ApiService);

  /** Reads datasets by path. A path that doesn't exist is left out, as `zfs.resource.list` does. */
  loadDatasets(paths: string[], options: LoadDatasetOptions = {}): Observable<Dataset[]> {
    const query: ZfsResourceQuery = {
      paths,
      properties: datasetProperties,
      get_source: true,
      get_user_properties: true,
    };
    if (options.withChildren) {
      query.max_depth = 1;
      query.nest_results = true;
    }
    return this.api.call('zfs.resource.list', [query]).pipe(
      map((rows) => rows.map(zfsResourceToDataset)),
    );
  }

  /** Reads one dataset, and fails if it doesn't exist. */
  loadDataset(path: string, options: LoadDatasetOptions = {}): Observable<Dataset> {
    return this.loadDatasets([path], options).pipe(
      map((datasets) => {
        const dataset = datasets.find((row) => row.name === path);
        if (!dataset) {
          throw new Error(`Dataset ${path} does not exist.`);
        }
        return dataset;
      }),
    );
  }

  /** Creates a dataset or zvol, then reads it back whole: `zfs.resource.create` returns only what it set. */
  createDataset(payload: DatasetCreate): Observable<Dataset> {
    return this.api.call('zfs.resource.create', [toZfsResourceCreate(payload)]).pipe(
      switchMap(() => this.loadDataset(payload.name)),
    );
  }

  /** Updates a dataset or zvol, then reads it back whole: `zfs.resource.set` returns only what changed. */
  updateDataset(path: string, payload: DatasetUpdate): Observable<Dataset> {
    return this.api.call('zfs.resource.set', [toZfsResourceSet(path, payload)]).pipe(
      switchMap(() => this.loadDataset(path)),
    );
  }

  /** Destroys a dataset or zvol with its children, snapshots and clones. Attachments are removed or stopped first. */
  deleteDataset(path: string): Observable<null> {
    return this.api.call('zfs.resource.destroy', [{ path, recursive: true }]);
  }
}
