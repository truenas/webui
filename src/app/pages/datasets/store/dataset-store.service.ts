import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DatasetState {

}

/**
 * TODO: Doesn't do much.
 * Consider moving some data logic from dataset-management to here
 * or if decided against it, replacing with a simple message to reload data.
 */
@Injectable()
export class DatasetStore extends ComponentStore<DatasetState> {
  // TODO: Change to effect.
  readonly onReloadList = new Subject<void>();

  readonly reloadList = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => this.onReloadList.next()),
    );
  });
}
