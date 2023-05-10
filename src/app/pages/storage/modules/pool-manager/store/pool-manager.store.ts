import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { forkJoin } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  differenceByDiskName,
  isSafeDisk, topologyToDiskNames,
} from 'app/pages/storage/modules/pool-manager/utils/pool-manager.utils';
import { DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface PoolManagerTopologyCategory {
  layout: CreateVdevLayout;
  vdevs: string[][];
  hasCustomLayout: boolean;
}

export type PoolManagerTopology = {
  [category in VdevType]: PoolManagerTopologyCategory;
};

export interface PoolManagerState {
  isLoading: boolean;

  allDisks: UnusedDisk[];
  allowedDisks: UnusedDisk[];
  enclosures: Enclosure[];
  topology: PoolManagerTopology;
}

const initialTopology = Object.values(VdevType).reduce((topology, value) => {
  return {
    ...topology,
    [value]: {
      hasCustomLayout: false,
      vdevs: [],
    },
  };
}, {} as PoolManagerState['topology']);

const initialState: PoolManagerState = {
  isLoading: false,
  allDisks: [],
  allowedDisks: [],
  enclosures: [],
  topology: initialTopology,
};

@Injectable()
export class PoolManagerStore extends ComponentStore<PoolManagerState> {
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly hasMultipleEnclosures$ = this.select((state) => state.enclosures.length > 1);
  readonly allDisks$ = this.select((state) => state.allDisks);
  readonly inventory$ = this.select((state) => {
    const allUsedDiskNames = topologyToDiskNames(state.topology);
    return differenceByDiskName(state.allowedDisks, allUsedDiskNames);
  });

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
  ) {
    super(initialState);
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.setState({
        ...initialState,
        isLoading: true,
      })),
      switchMap(() => {
        return forkJoin([
          this.ws.call('disk.get_unused'),
          this.ws.call('enclosure.query'),
        ]).pipe(
          tapResponse(([allDisks, enclosures]) => {
            const safeDisks = this.get().allDisks.filter(isSafeDisk);

            this.patchState({
              isLoading: false,
              allDisks,
              enclosures,
              allowedDisks: safeDisks,
            });
          },
          (error: WebsocketError) => {
            this.patchState({ isLoading: false });
            this.dialogService.error(this.errorHandler.parseWsError(error));
          }),
        );
      }),
    );
  });

  readonly resetTopologyCategory = this.updater((state, category: VdevType) => {
    return {
      ...state,
      topology: {
        ...state.topology,
        [category]: initialTopology[category],
      },
    };
  });

  readonly resetTopology = this.updater((state) => {
    return {
      ...state,
      topology: initialTopology,
    };
  });

  setAllowedUnsafeDisks(unsafeDisks: UnusedDisk[]): void {
    const safeDisks = this.get().allDisks.filter(isSafeDisk);
    const allowedDisks = [...safeDisks, ...unsafeDisks];

    this.patchState({ allowedDisks });
    // TODO: Only reset affected topology.
    // TODO: Or at least only reset topology if disks are removed.
    this.resetTopology();
  }

  setTopologyCategory(category: VdevType, topology: PoolManagerTopology): void {
    this.patchState({
      topology: {
        ...this.get().topology,
        [category]: topology,
      },
    });
  }
}
