import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  EMPTY, Observable, filter, switchMap, tap,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VolumesData } from 'app/interfaces/volume-data.interface';
import { WebSocketService } from 'app/services';

export interface DashboardStorageState {
  pools: Pool[];
  volumesData: VolumesData;
  isLoading: boolean;
}

const initialState: DashboardStorageState = {
  pools: [],
  isLoading: false,
  volumesData: {},
};

@Injectable()
export class DashboardStorageStore extends ComponentStore<DashboardStorageState> {
  readonly pools$ = this.select((state) => state.pools);
  readonly volumesData$ = this.select((state) => state.volumesData);
  readonly isLoading$ = this.select((state) => state.isLoading);

  constructor(
    private ws: WebSocketService,
  ) {
    super(initialState);
    this.initialize();
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.patchState((state) => ({
        ...state,
        isLoading: true,
      }))),
      switchMap(() => this.loadPoolData()),
      switchMap((pools) => {
        if (pools?.length) {
          return this.loadVolumeData();
        }
        return EMPTY;
      }),
      tap(() => this.patchState((state) => ({
        ...state,
        isLoading: false,
      }))),
      switchMap(() => this.listenToPoolUpdates()),
    );
  });

  private loadPoolData(): Observable<Pool[]> {
    return this.ws.call('pool.query').pipe(
      tap((pools) => {
        this.patchState((state) => {
          return {
            ...state,
            pools,
          };
        });
      }),
    );
  }

  private setVolumeData(data: Dataset[]): void {
    const vd: VolumesData = {};

    data.forEach((dataset) => {
      if (typeof dataset === undefined || !dataset) { return; }
      const usedPercent = dataset.used.parsed / (dataset.used.parsed + dataset.available.parsed);
      const zvol = {
        avail: dataset.available.parsed,
        id: dataset.id,
        name: dataset.name,
        used: dataset.used.parsed,
        used_pct: (usedPercent * 100).toFixed(0) + '%',
      };

      vd[zvol.id] = zvol;
    });

    this.patchState((state) => {
      return {
        ...state,
        volumesData: vd,
      };
    });
  }

  private listenToPoolUpdates(): Observable<Pool[]> {
    return this.ws.subscribe('pool.query').pipe(
      filter((event) => event.msg !== IncomingApiMessageType.Removed),
      switchMap(() => this.loadPoolData()),
    );
  }

  private loadVolumeData(): Observable<Dataset[]> {
    return this.ws.call(
      'pool.dataset.query',
      [[], { extra: { retrieve_children: false } }],
    ).pipe(
      tap((datasets) => {
        this.setVolumeData(datasets);
      }),
    );
  }
}
