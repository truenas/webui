import { computed, Injectable, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { keyBy } from 'lodash-es';
import {
  debounceTime, filter, map, Observable, of, pipe, switchMap, tap,
} from 'rxjs';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDevNestedDataNode, isVdevGroup, VDevGroup } from 'app/interfaces/device-nested-data-node.interface';
import { Disk, toDisk } from 'app/interfaces/disk.interface';
import { PoolTopology, toPool } from 'app/interfaces/pool.interface';
import { isTopologyDisk, TopologyDisk, VDevItem } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface VDevsState {
  isLoading: boolean;
  poolId: number | null;
  poolName: string;
  nodes: VDevNestedDataNode[];
  diskDictionary: Record<string, Disk>;
  selectedNodeGuid: string | null;
}

const initialState: VDevsState = {
  isLoading: false,
  poolId: null,
  poolName: '',
  nodes: [],
  diskDictionary: {},
  selectedNodeGuid: null,
};

@Injectable({
  providedIn: 'root',
})
export class VDevsStore {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly poolName = this.state.poolName;
  readonly nodes = this.state.nodes;
  readonly diskDictionary = this.state.diskDictionary;

  readonly selectedBranch = computed(() => {
    const selectedNodeGuid = this.state.selectedNodeGuid();
    if (!selectedNodeGuid) {
      return null;
    }

    return getTreeBranchToNode(this.state.nodes(), (dataset) => dataset.guid === selectedNodeGuid);
  });

  readonly selectedNode = computed(() => {
    const selectedBranch = this.selectedBranch();
    return selectedBranch ? selectedBranch[selectedBranch.length - 1] : null;
  });

  readonly selectedParentNode = computed(() => {
    const selectedBranch = this.selectedBranch();
    return selectedBranch ? selectedBranch[selectedBranch.length - 2] : null;
  });

  readonly selectedTopologyCategory = computed(() => {
    const selectedBranch = this.selectedBranch();
    return selectedBranch ? (selectedBranch[0] as VDevGroup).guid : null;
  });

  readonly loadNodes = rxMethod<number>(pipe(
    tap((poolId) => patchState(this.state, { ...initialState, poolId, isLoading: true })),
    switchMap((poolId) => this.fetchPool(poolId).pipe(
      tapResponse({
        next: (loaded) => patchState(this.state, { ...loaded, isLoading: false }),
        error: (error: unknown) => {
          patchState(this.state, { isLoading: false });
          this.errorHandler.showErrorModal(error);
        },
      }),
    )),
  ));

  /**
   * Refreshes the loaded pool when middleware reports that its devices changed: a disk faulted or dropped off,
   * a resilver finished, a spare took over. The store is shared across the app, so the page subscribes to this
   * for as long as it is open. Unlike `loadNodes`, it keeps the selection and leaves `isLoading` alone, so the
   * tree doesn't flash.
   */
  listenForPoolChanges(): Observable<unknown> {
    return this.api.subscribe('pool.query').pipe(
      filter((event) => event.msg === 'changed'),
      filter((event) => event.id === this.state.poolId()),
      // A state change and the config sync that follows it arrive together.
      debounceTime(300),
      filter((event) => {
        const changedNodes = this.createDataNodes(toPool(event.fields).topology);
        return getTopologyKey(changedNodes) !== getTopologyKey(this.state.nodes());
      }),
      switchMap((event) => this.fetchPool(event.id).pipe(
        tapResponse({
          next: (loaded) => patchState(this.state, loaded),
          error: (error: unknown) => this.errorHandler.showErrorModal(error),
        }),
      )),
    );
  }

  reloadList(): void {
    const poolId = this.state.poolId();
    if (poolId) {
      this.loadNodes(poolId);
    }
  }

  selectNodeByGuid(selectedNodeGuid: string): void {
    patchState(this.state, { selectedNodeGuid });
  }

  private fetchPool(poolId: number): Observable<Partial<VDevsState>> {
    return this.api.query('pool.query', [['id', '=', poolId]]).pipe(
      map((pools) => pools.map(toPool)),
      switchMap(([pool]) => {
        if (!pool) {
          return of({});
        }
        return this.api.query('disk.query', [['pool', '=', pool.name]], { extra: { pools: true } }).pipe(
          map((disks) => ({
            poolName: pool.name,
            diskDictionary: keyBy(disks.map(toDisk), (disk) => disk.devname),
            nodes: this.createDataNodes(pool.topology),
          })),
        );
      }),
    );
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
        group: this.translate.instant('Special'),
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
          return { ...child, isRoot: true };
        }) as TopologyDisk[],
      };
    });
  }

  getDisk(node: VDevNestedDataNode): Disk | undefined {
    if (isVdevGroup(node) || !isTopologyDisk(node)) {
      return undefined;
    }
    return this.state.diskDictionary()[node.disk];
  }
}

/**
 * What a change event can alter that the page shows: which devices there are and where, their state and their
 * error counts. Usage statistics are left out because they change all the time.
 */
function getTopologyKey(nodes: VDevNestedDataNode[]): string {
  return JSON.stringify(describeNodes(nodes));
}

// Sorted by guid, because the tree sorts the children of the nodes it is given in place.
function describeNodes(nodes: VDevNestedDataNode[] = []): unknown[] {
  return [...nodes]
    .sort((nodeA, nodeB) => nodeA.guid.localeCompare(nodeB.guid))
    .map((node) => {
      if (isVdevGroup(node)) {
        return [node.guid, describeNodes(node.children)];
      }

      return [
        node.guid,
        node.status,
        node.stats?.read_errors,
        node.stats?.write_errors,
        node.stats?.checksum_errors,
        describeNodes(node.children),
      ];
    });
}
