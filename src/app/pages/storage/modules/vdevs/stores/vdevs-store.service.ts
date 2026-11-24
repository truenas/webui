import { computed, Injectable, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { keyBy } from 'lodash-es';
import {
  catchError, debounceTime, EMPTY, exhaustMap, filter, finalize, interval, map, merge, Observable, of, pipe,
  switchMap, tap,
} from 'rxjs';
import { TopologyItemType, VDevType } from 'app/enums/v-dev-type.enum';
import { VDevNestedDataNode, isVdevGroup, VDevGroup } from 'app/interfaces/device-nested-data-node.interface';
import { Disk, toDisk } from 'app/interfaces/disk.interface';
import { Pool, PoolTopology, toPool } from 'app/interfaces/pool.interface';
import { isTopologyDisk, TopologyDisk, VDevItem } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface VDevsState {
  isLoading: boolean;
  poolId: number | null;
  poolName: string;
  pool: Pool | null;
  nodes: VDevNestedDataNode[];
  diskDictionary: Record<string, Disk>;
  selectedNodeGuid: string | null;
}

/** How often the page re-reads a pool while it shows a replacement in progress. */
const replacingPollIntervalMs = 5000;

/** A pool to read; `pool` is set when the caller already holds its fresh `pool.query` answer. */
interface PoolRead {
  poolId: number;
  pool?: Pool;
}

const initialState: VDevsState = {
  isLoading: false,
  poolId: null,
  poolName: '',
  pool: null,
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

  /** A read started by `fetch` has not answered yet. */
  private isFetching = false;

  readonly isLoading = this.state.isLoading;
  readonly poolName = this.state.poolName;
  readonly pool = this.state.pool;
  readonly nodes = this.state.nodes;
  readonly diskDictionary = this.state.diskDictionary;

  /** The pool is known to middleware but ZFS does not list it, e.g. it failed to import, so it has no devices. */
  readonly isPoolUnavailable = computed(() => {
    const pool = this.state.pool();
    return Boolean(pool && !pool.topology);
  });

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

  /**
   * Every read of the pool (a full load, a refresh after a change event, or one found by `pollWhileReplacing`)
   * goes through this one `switchMap`, so a newer read cancels an older one still in flight and an older answer
   * can never put a stale topology back over a newer one.
   */
  private readonly fetch = rxMethod<PoolRead & { isRefresh: boolean }>(pipe(
    tap(({ poolId, isRefresh }) => {
      if (!isRefresh) {
        patchState(this.state, { ...initialState, poolId, isLoading: true });
      }
    }),
    switchMap(({ poolId, pool }) => {
      // `switchMap` finalizes the read it cancels before it starts this one, so the flag stays set.
      this.isFetching = true;
      return this.fetchPool(poolId, pool).pipe(
        tapResponse({
          next: (loaded) => patchState(this.state, { ...loaded, isLoading: false }),
          error: (error: unknown) => {
            patchState(this.state, { isLoading: false });
            this.errorHandler.showErrorModal(error);
          },
        }),
        finalize(() => {
          this.isFetching = false;
        }),
      );
    }),
  ));

  loadNodes(poolId: number): void {
    this.fetch({ poolId, isRefresh: false });
  }

  /**
   * Refreshes the loaded pool when middleware reports that its devices changed: a disk faulted or dropped off,
   * a resilver finished, a spare took over. The store is shared across the app, so the page subscribes to this
   * for as long as it is open. Unlike `loadNodes`, it keeps the selection and doesn't set `isLoading`, so the
   * tree doesn't flash.
   */
  listenForPoolChanges(): Observable<void> {
    const changeEvents$ = this.api.subscribe('pool.query').pipe(
      filter((event) => event.msg === 'changed'),
      filter((event) => event.id === this.state.poolId()),
      // A state change and the config sync that follows it arrive together.
      debounceTime(300),
      filter((event) => this.hasTopologyChanged(toPool(event.fields).topology)),
      map((event): PoolRead => ({ poolId: event.id })),
    );

    return merge(changeEvents$, this.pollWhileReplacing()).pipe(
      map((read) => {
        this.fetch({ ...read, isRefresh: true });
      }),
    );
  }

  /**
   * A REPLACING vdev collapses on its own once the resilver ends, but middleware sends no `pool.query` change
   * event when it does: the Replace job ends as soon as the new disk is attached, and nothing reports the detach
   * that follows the resilver. So while the page shows a replacement, it reads the pool itself every few seconds,
   * and reloads it only once the topology has moved on. Ticks are skipped while a read is in flight: the tree
   * shows the replacement until that read lands, so a tick then would start another reload and cancel it.
   */
  private pollWhileReplacing(): Observable<PoolRead> {
    return interval(replacingPollIntervalMs).pipe(
      filter(() => !this.isFetching),
      map(() => this.state.poolId()),
      filter((poolId): poolId is number => poolId !== null && hasReplacingVdev(this.state.nodes())),
      exhaustMap((poolId) => this.api.query('pool.query', [['id', '=', poolId]]).pipe(
        map(([pool]) => (pool ? toPool(pool) : undefined)),
        filter((pool): pool is Pool => Boolean(pool) && this.hasTopologyChanged(pool.topology)),
        map((pool): PoolRead => ({ poolId, pool })),
        // A failed check is retried on the next tick; the page keeps what it shows.
        catchError(() => EMPTY),
      )),
    );
  }

  private hasTopologyChanged(topology: PoolTopology | null): boolean {
    return getTopologyKey(this.createDataNodes(topology)) !== getTopologyKey(this.state.nodes());
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

  private fetchPool(poolId: number, knownPool?: Pool): Observable<Partial<VDevsState>> {
    const pools$ = knownPool
      ? of([knownPool])
      : this.api.query('pool.query', [['id', '=', poolId]]).pipe(map((pools) => pools.map(toPool)));
    return pools$.pipe(
      switchMap(([pool]) => {
        if (!pool) {
          return of({});
        }
        return this.api.query('disk.query', [['pool', '=', pool.name]], { extra: { pools: true } }).pipe(
          map((disks) => ({
            poolName: pool.name,
            pool,
            diskDictionary: keyBy(disks.map(toDisk), (disk) => disk.devname),
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

function hasReplacingVdev(nodes: VDevNestedDataNode[] = []): boolean {
  return nodes.some((node) => {
    if (!isVdevGroup(node) && node.type === TopologyItemType.Replacing) {
      return true;
    }
    return hasReplacingVdev(node.children);
  });
}
