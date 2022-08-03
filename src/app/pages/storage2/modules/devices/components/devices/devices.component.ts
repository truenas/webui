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
import { DeviceNestedDataNode, isVdevGroup } from 'app/interfaces/device-nested-data-node.interface';
import { PoolTopology } from 'app/interfaces/pool.interface';
import {
  Disk, isTopologyDisk, isVdev, TopologyItem,
} from 'app/interfaces/storage.interface';
import { footerHeight, headerHeight } from 'app/modules/common/layouts/admin-layout/admin-layout.component.const';
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
  selectedItem: TopologyItem;
  selectedParentItem: DeviceNestedDataNode | undefined;
  dataSource: IxNestedTreeDataSource<DeviceNestedDataNode>;
  poolId: number;
  treeControl = new NestedTreeControl<DeviceNestedDataNode, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.guid,
  });
  diskDictionary: { [key: string]: Disk } = {};
  isLoading = false;
  hasConsoleFooter = false;
  headerHeight = headerHeight;
  footerHeight = footerHeight;

  readonly hasNestedChild = (_: number, node: DeviceNestedDataNode): boolean => Boolean(node.children?.length);
  readonly isVdevGroup = (_: number, node: DeviceNestedDataNode): boolean => isVdevGroup(node);

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private devicesStore: DevicesStore,
    private translate: TranslateService,
  ) { }

  getDisk(node: DeviceNestedDataNode): Disk {
    if (isVdevGroup(node) || !isTopologyDisk(node)) {
      return undefined;
    }
    return this.diskDictionary[node.disk];
  }

  ngOnInit(): void {
    this.loadTopologyAndDisks();

    this.devicesStore.onReloadList
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadTopologyAndDisks());

    this.ws
      .call('system.advanced.config')
      .pipe(untilDestroyed(this))
      .subscribe((advancedConfig) => {
        this.hasConsoleFooter = advancedConfig.consolemsg;
      });

    this.route.params.pipe(
      pluck('guid'),
      untilDestroyed(this),
    ).subscribe((guid) => {
      this.listenForRouteChanges(guid);
    });
  }

  private createDataSource(dataNodes: DeviceNestedDataNode[]): void {
    dataNodes.forEach((dataNode) => {
      this.sortDataNodesByDiskName(dataNode.children);
    });
    this.dataSource = new IxNestedTreeDataSource(dataNodes);
    this.dataSource.filterPredicate = (dataNodes, query = '') => {
      return flattenTreeWithFilter(dataNodes, (dataNode) => {
        if (isVdevGroup(dataNode)) {
          return false;
        }

        if (isVdev(dataNode)) {
          return dataNode.name?.toLowerCase().includes(query.toLowerCase());
        }

        if (isTopologyDisk(dataNode)) {
          return dataNode.disk?.toLowerCase().includes(query.toLowerCase());
        }

        return false;
      });
    };
  }

  private createDataNodes(topology: PoolTopology): DeviceNestedDataNode[] {
    const dataNodes: DeviceNestedDataNode[] = [];
    if (topology.data.length) {
      dataNodes.push({ children: topology.data, group: this.translate.instant('Data VDEVs'), guid: 'data' });
    }
    if (topology.cache.length) {
      dataNodes.push({ children: topology.cache, group: this.translate.instant('Cache'), guid: 'cache' });
    }
    if (topology.log.length) {
      dataNodes.push({ children: topology.log, group: this.translate.instant('Log'), guid: 'log' });
    }
    if (topology.spare.length) {
      dataNodes.push({ children: topology.spare, group: this.translate.instant('Spare'), guid: 'spare' });
    }
    if (topology.special.length) {
      dataNodes.push({ children: topology.special, group: this.translate.instant('Metadata'), guid: 'special' });
    }
    if (topology.dedup.length) {
      dataNodes.push({ children: topology.dedup, group: this.translate.instant('Dedup'), guid: 'dedup' });
    }
    return dataNodes;
  }

  private selectVdevGroupNode(): void {
    this.treeControl?.dataNodes?.forEach((node) => this.treeControl.expand(node));
    this.selectedParentItem = undefined;
  }

  private listenForRouteChanges(id: string): void {
    this.selectedItem = undefined;
    this.selectedParentItem = undefined;

    if (!id || !this.treeControl.dataNodes) {
      return;
    }
    findInTree(this.treeControl.dataNodes, (dataNode) => {
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
        this.selectedItem = dataNode as TopologyItem;
        this.selectedParentItem = undefined;
        return true;
      }
      return false;
    });

    this.treeControl.expand(this.selectedParentItem);
    this.cdr.markForCheck();
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

  private sortDataNodesByDiskName(dataNodes: DeviceNestedDataNode[]): void {
    dataNodes.forEach((dataNodes) => {
      if (dataNodes.children.length > 0) {
        dataNodes.children.sort((a, b) => {
          const na = a.disk.toLowerCase();
          const nb = b.disk.toLowerCase();

          if (na < nb) return -1;
          if (na > nb) return 1;

          return 0;
        });
        this.sortDataNodesByDiskName(dataNodes.children);
      }
    });
  }
}
