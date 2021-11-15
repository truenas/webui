import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'app/store/reducers';

@Injectable()
export class IxTableService {
  constructor(private store$: Store<AppState>) {
  }

  loadData(): void {
    console.info('[ix-table-service] Load Data');
  }
}
