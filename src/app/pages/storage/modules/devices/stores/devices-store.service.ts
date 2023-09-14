import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DeviceNestedDataNode, VDevGroup } from 'app/interfaces/device-nested-data-node.interface';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';
import { WebSocketService } from 'app/services/ws.service';

export interface DevicesState {
  isLoading: boolean;
  poolId: number;
  error: WebsocketError | null;
  nodes: DeviceNestedDataNode[];
  diskDictionary: { [key: string]: Disk };
  selectedNodeGuid: string | null;
}

const initialState: DevicesState = {
  isLoading: false,
  poolId: null,
  error: null,
  nodes: [],
  diskDictionary: {},
  selectedNodeGuid: null,
};

@Injectable()
export class DevicesStore extends ComponentStore<DevicesState> {
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly error$ = this.select((state) => state.error);
  readonly nodes$ = this.select((state) => state.nodes);
  readonly diskDictionary$ = this.select((state) => state.diskDictionary);
  readonly selectedBranch$ = this.select((state) => {
    if (!state.selectedNodeGuid) {
      return null;
    }

    const selectedBranch = getTreeBranchToNode(state.nodes, (dataset) => dataset.guid === state.selectedNodeGuid);
    if (!selectedBranch) {
      return null;
    }

    return selectedBranch;
  });

  readonly selectedNode$ = this.select(
    this.selectedBranch$,
    (selectedBranch) => (selectedBranch ? selectedBranch[selectedBranch.length - 1] : null),
  );

  readonly selectedParentNode$ = this.select(
    this.selectedBranch$,
    (selectedBranch) => (selectedBranch ? selectedBranch[selectedBranch.length - 2] : null),
  );

  readonly selectedTopologyCategory$ = this.select(
    this.selectedBranch$,
    (selectedBranch) => (selectedBranch ? (selectedBranch[0] as VDevGroup).guid : null),
  );

  readonly loadNodes = this.effect((poolIds$: Observable<number>) => {
    return poolIds$.pipe(
      tap((poolId) => {
        this.patchState({
          ...initialState,
          poolId,
          isLoading: true,
        });
      }),
      switchMap((poolId) => {
        return this.ws.call('pool.query', [[['id', '=', poolId]]]).pipe(
          switchMap((pools) => {
            if (!pools?.length) {
              return of([]);
            }
            return this.ws.call('disk.query', [[['pool', '=', pools[0].name]], { extra: { pools: true } }]).pipe(
              tap((disks) => {
                this.patchState({
                  isLoading: false,
                  error: null,
                  diskDictionary: _.keyBy(disks, (disk) => disk.devname),
                  nodes: this.createDataNodes(pools[0].topology),
                });
              }),
              catchError((error: WebsocketError) => {
                this.patchState({
                  isLoading: false,
                  error,
                });

                return EMPTY;
              }),
            );
          }),
        );
      }),
    );
  });

  readonly reloadList = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        const poolId = this.get((state) => state.poolId);
        this.loadNodes(poolId);
      }),
    );
  });

  readonly selectNodeByGuid = this.updater((state, selectedNodeGuid: string) => {
    return {
      ...state,
      selectedNodeGuid,
    };
  });

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
  ) {
    super(initialState);
  }

  private createDataNodes(topology: PoolTopology): DeviceNestedDataNode[] {
    const dataNodes: DeviceNestedDataNode[] = [];
    if (topology.data.length) {
      dataNodes.push({
        children: topology.data,
        group: this.translate.instant('Data VDEVs'),
        guid: VdevType.Data,
      });
    }
    if (topology.cache.length) {
      dataNodes.push({
        children: topology.cache,
        group: this.translate.instant('Cache'),
        guid: VdevType.Cache,
      });
    }
    if (topology.log.length) {
      dataNodes.push({
        children: topology.log,
        group: this.translate.instant('Log'),
        guid: VdevType.Log,
      });
    }
    if (topology.spare.length) {
      dataNodes.push({
        children: topology.spare,
        group: this.translate.instant('Spare'),
        guid: VdevType.Spare,
      });
    }
    if (topology.special.length) {
      dataNodes.push({
        children: topology.special,
        group: this.translate.instant('Metadata'),
        guid: VdevType.Special,
      });
    }
    if (topology.dedup.length) {
      dataNodes.push({
        children: topology.dedup,
        group: this.translate.instant('Dedup'),
        guid: VdevType.Dedup,
      });
    }
    return dataNodes;
  }
}
