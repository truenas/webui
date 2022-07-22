import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { EMPTY } from 'rxjs';
import {
  catchError, pluck, switchMap, tap,
} from 'rxjs/operators';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { DeviceNestedDataNode, isVDev } from 'app/interfaces/device-nested-data-node.interface';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { findInTree } from 'app/modules/ix-tree/utils/find-in-tree.utils';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { DevicesStore } from 'app/pages/storage2/modules/devices/stores/devices-store.service';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesComponent implements OnInit {
  topology: PoolTopology;
  selectedItem: DeviceNestedDataNode;
  selectedParentItem: DeviceNestedDataNode | undefined;
  dataSource: IxNestedTreeDataSource<DeviceNestedDataNode>;
  poolId: number;
  treeControl = new NestedTreeControl<DeviceNestedDataNode, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.guid,
  });
  diskDictionary: { [key: string]: Disk } = {};
  isLoading = false;

  readonly hasNestedChild = (_: number, vdev: DeviceNestedDataNode): boolean => Boolean(vdev.children?.length);
  readonly isVdevGroup = (_: number, vdev: DeviceNestedDataNode): boolean => !isVDev(vdev);

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private devicesStore: DevicesStore,
    private translate: TranslateService,
  ) { }

  get isDiskSelected(): boolean {
    return isVDev(this.selectedItem) && this.selectedItem.type === VDevType.Disk;
  }

  ngOnInit(): void {
    this.loadTopologyAndDisks();

    this.devicesStore.onReloadList
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadTopologyAndDisks());

    this.route.params.pipe(
      pluck('guid'),
      untilDestroyed(this),
    ).subscribe((guid) => {
      this.listenForRouteChanges(guid);
    });
  }

  private createDataSource(dataNodes: DeviceNestedDataNode[]): void {
    this.dataSource = new IxNestedTreeDataSource(dataNodes);
    this.dataSource.filterPredicate = (dataNodes, query = '') => {
      return flattenTreeWithFilter(dataNodes, (dataNode) => {
        if (isVDev(dataNode)) {
          switch (dataNode.type) {
            case VDevType.Disk:
              return dataNode.disk?.toLowerCase().includes(query.toLowerCase());
            case VDevType.Mirror:
              return dataNode.name?.toLowerCase().includes(query.toLowerCase());
          }
        } else {
          return false;
        }
      });
    };
  }

  private createDataNodes(topology: PoolTopology): DeviceNestedDataNode[] {
    const dataNodes: DeviceNestedDataNode[] = [];
    if (topology.data.length) {
      dataNodes.push({ children: topology.data, disk: this.translate.instant('Data VDEVs'), guid: 'data' } as DeviceNestedDataNode);
    }
    if (topology.cache.length) {
      dataNodes.push({ children: topology.cache, disk: this.translate.instant('Cache'), guid: 'cache' } as DeviceNestedDataNode);
    }
    if (topology.log.length) {
      dataNodes.push({ children: topology.log, disk: this.translate.instant('Log'), guid: 'log' } as DeviceNestedDataNode);
    }
    if (topology.spare.length) {
      dataNodes.push({ children: topology.spare, disk: this.translate.instant('Spare'), guid: 'spare' } as DeviceNestedDataNode);
    }
    if (topology.special.length) {
      dataNodes.push({ children: topology.special, disk: this.translate.instant('Metadata'), guid: 'special' } as DeviceNestedDataNode);
    }
    if (topology.dedup.length) {
      dataNodes.push({ children: topology.dedup, disk: this.translate.instant('Dedup'), guid: 'dedup' } as DeviceNestedDataNode);
    }
    return dataNodes;
  }

  private selectVdevGroupNode(): void {
    this.treeControl?.dataNodes?.forEach((node) => this.treeControl.expand(node));
    this.selectedParentItem = undefined;
  }

  private listenForRouteChanges(id: string): void {
    if (id && this.dataSource?.data) {
      findInTree(this.dataSource.data, (dataNode) => {
        if (dataNode.children?.length && dataNode.guid !== id) {
          const item = dataNode.children.find((child) => child.guid === id);
          if (item) {
            this.selectedItem = item;
            this.selectedParentItem = dataNode;
            return true;
          }
          return false;
        }

        if (dataNode.guid === id) {
          this.selectedItem = dataNode;
          this.selectedParentItem = undefined;
          return true;
        }
        return false;
      });
    }
  }

  onRowGroupSelected(dataNodeSelected: DeviceNestedDataNode, _: MouseEvent): void {
    if (this.treeControl.isExpanded(dataNodeSelected)) {
      this.treeControl.collapse(dataNodeSelected);
    } else {
      this.treeControl.expand(dataNodeSelected);
    }
  }

  onSearch(query: string): void {
    this.dataSource.filter(query);
  }

  private loadTopologyAndDisks(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.poolId = Number(this.route.snapshot.paramMap.get('poolId'));
    this.ws.call('pool.query', [[['id', '=', this.poolId]]]).pipe(
      switchMap((pools) => {
        // TODO: Handle pool not found.
        return this.ws.call('disk.query', [[['pool', '=', pools[0].name]], { extra: { pools: true } }]).pipe(
          tap((disks) => {
            this.diskDictionary = _.keyBy(disks, (disk) => disk.devname);
            this.topology = pools[0].topology;
            const dataNodes = this.createDataNodes(pools[0].topology);
            this.treeControl.dataNodes = dataNodes;
            this.createDataSource(dataNodes);
            this.selectVdevGroupNode();
            this.isLoading = false;

            const routeDatasetId = this.route.snapshot.paramMap.get('guid');
            this.listenForRouteChanges(routeDatasetId);
            this.cdr.markForCheck();
          }),
        );
      }),
      catchError(() => {
        // TODO: Handle error.
        this.isLoading = false;
        this.cdr.markForCheck();
        return EMPTY;
      }),
      untilDestroyed(this),
    )
      .subscribe();
  }
}
