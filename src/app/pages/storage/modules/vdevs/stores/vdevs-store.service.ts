import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import { keyBy } from 'lodash-es';
import { EMPTY, Observable, of } from 'rxjs';
import {
  catchError, debounceTime, filter, map, switchMap, tap,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDevNestedDataNode, isVdevGroup, VDevGroup } from 'app/interfaces/device-nested-data-node.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { isTopologyDisk, TopologyDisk, VDevItem } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface VDevsState {
  isLoading: boolean;
  poolId: number | null;
  poolName: string;
  error: unknown;
  nodes: VDevNestedDataNode[];
  diskDictionary: Record<string, Disk>;
  selectedNodeGuid: string | null;
}

const initialState: VDevsState = {
  isLoading: false,
  poolId: null,
  poolName: '',
  error: null,
  nodes: [],
  diskDictionary: {},
  selectedNodeGuid: null,
};

@Injectable({
  providedIn: 'root',
})
export class VDevsStore extends ComponentStore<VDevsState> {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);

  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly error$ = this.select((state) => state.error);
  readonly poolName$ = this.select((state) => state.poolName);
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
        return this.fetchPool(poolId).pipe(
          tap((loaded) => this.patchState({ ...loaded, isLoading: false, error: null })),
          catchError((error: unknown) => {
            this.patchState({
              isLoading: false,
              error,
            });

            this.errorHandler.showErrorModal(error);

            return EMPTY;
          }),
        );
      }),
    );
  });

  /**
   * Refreshes the loaded pool when middleware reports that its devices changed: a disk faulted or dropped off,
   * a resilver finished, a spare took over. The store is shared across the app, so the page subscribes to this
   * for as long as it is open. Unlike `loadNodes`, it keeps the selection and leaves `isLoading` alone, so the
   * tree doesn't flash.
   */
  listenForPoolChanges(): Observable<unknown> {
    return this.api.subscribe('pool.query').pipe(
      filter((event) => event.msg === CollectionChangeType.Changed),
      filter((event) => event.id === this.get().poolId),
      // A state change and the config sync that follows it arrive together.
      debounceTime(300),
      filter((event) => {
        const changedNodes = this.createDataNodes(event.fields.topology);
        return getTopologyKey(changedNodes) !== getTopologyKey(this.get().nodes);
      }),
      switchMap((event) => this.fetchPool(event.id as number).pipe(
        tap((loaded) => this.patchState(loaded)),
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          return EMPTY;
        }),
      )),
    );
  }

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

  constructor() {
    super(initialState);
  }

  private fetchPool(poolId: number): Observable<Partial<VDevsState>> {
    return this.api.call('pool.query', [[['id', '=', poolId]]]).pipe(
      switchMap(([pool]) => {
        if (!pool) {
          return of({});
        }
        return this.api.call('disk.query', [[['pool', '=', pool.name]], { extra: { pools: true } }]).pipe(
          map((disks) => ({
            poolName: pool.name,
            diskDictionary: keyBy(disks, (disk) => disk.devname),
            nodes: this.createDataNodes(pool.topology),
          })),
        );
      }),
    );
  }

  private createDataNodes(topology: PoolTopology | null): VDevNestedDataNode[] {
    // Middleware reports no topology for a pool that ZFS does not list, so there are no devices to show.
    if (!topology) {
      return [];
    }

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
          return { ...child, isRoot: true };
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
