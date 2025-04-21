import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import { keyBy } from 'lodash-es';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDevNestedDataNode, isVdevGroup, VDevGroup } from 'app/interfaces/device-nested-data-node.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { isTopologyDisk, TopologyDisk, VDevItem } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';

export interface VDevsState {
  isLoading: boolean;
  poolId: number | null;
  error: unknown;
  nodes: VDevNestedDataNode[];
  diskDictionary: Record<string, Disk>;
  selectedNodeGuid: string | null;
}

const initialState: VDevsState = {
  isLoading: false,
  poolId: null,
  error: null,
  nodes: [],
  diskDictionary: {},
  selectedNodeGuid: null,
};

@Injectable({
  providedIn: 'root',
})
export class VDevsStore extends ComponentStore<VDevsState> {
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
        return this.api.call('pool.query', [[['id', '=', poolId]]]).pipe(
          switchMap((pools) => {
            if (!pools?.length) {
              return of([]);
            }
            return this.api.call('disk.query', [[['pool', '=', pools[0].name]], { extra: { pools: true } }]).pipe(
              tap((disks) => {
                this.patchState({
                  isLoading: false,
                  error: null,
                  diskDictionary: keyBy(disks, (disk) => disk.devname),
                  nodes: this.createDataNodes(pools[0].topology),
                });
              }),
              catchError((error: unknown) => {
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
        if (poolId) {
          this.loadNodes(poolId);
        }
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
    private api: ApiService,
    private translate: TranslateService,
  ) {
    super(initialState);
  }

  private createDataNodes(topology: PoolTopology): VDevNestedDataNode[] {
    const dataNodes: VDevNestedDataNode[] = [];
    if (topology.data.length) {
      dataNodes.push({
        children: topology.data,
        group: this.translate.instant('Data VDEVs'),
        guid: VDevType.Data,
      });
    }
    if (topology.cache.length) {
      dataNodes.push({
        children: topology.cache,
        group: this.translate.instant('Cache'),
        guid: VDevType.Cache,
      });
    }
    if (topology.log.length) {
      dataNodes.push({
        children: topology.log,
        group: this.translate.instant('Log'),
        guid: VDevType.Log,
      });
    }
    if (topology.spare.length) {
      dataNodes.push({
        children: topology.spare,
        group: this.translate.instant('Spare'),
        guid: VDevType.Spare,
      });
    }
    if (topology.special.length) {
      dataNodes.push({
        children: topology.special,
        group: this.translate.instant('Metadata'),
        guid: VDevType.Special,
      });
    }
    if (topology.dedup.length) {
      dataNodes.push({
        children: topology.dedup,
        group: this.translate.instant('Dedup'),
        guid: VDevType.Dedup,
      });
    }
    return dataNodes.map((node: VDevNestedDataNode) => {
      return {
        ...node,
        children: node.children.map((child: VDevItem) => {
          child.isRoot = true;
          return child;
        }) as TopologyDisk[],
      };
    });
  }

  getDisk(node: VDevNestedDataNode): Disk | undefined {
    if (isVdevGroup(node) || !isTopologyDisk(node)) {
      return undefined;
    }
    return this.state().diskDictionary[node.disk];
  }
}
