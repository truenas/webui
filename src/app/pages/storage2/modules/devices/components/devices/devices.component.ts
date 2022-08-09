import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, AfterViewInit, TemplateRef, ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, pluck } from 'rxjs/operators';
import { DeviceNestedDataNode, isVdevGroup } from 'app/interfaces/device-nested-data-node.interface';
import {
  Disk, isTopologyDisk, isVdev, TopologyDisk,
} from 'app/interfaces/storage.interface';
import { footerHeight, headerHeight } from 'app/modules/common/layouts/admin-layout/admin-layout.component.const';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { DevicesStore } from 'app/pages/storage2/modules/devices/stores/devices-store.service';
import { WebSocketService } from 'app/services';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  isLoading$ = this.devicesStore.isLoading$;
  selectedNode$ = this.devicesStore.selectedNode$;
  selectedParentNode$ = this.devicesStore.selectedParentNode$;

  diskDictionary: { [guid: string]: Disk } = {};
  dataSource: IxNestedTreeDataSource<DeviceNestedDataNode>;
  poolId: number;
  treeControl = new NestedTreeControl<DeviceNestedDataNode, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.guid,
  });

  hasConsoleFooter = false;
  readonly headerHeight = headerHeight;
  readonly footerHeight = footerHeight;

  readonly hasNestedChild = (_: number, node: DeviceNestedDataNode): boolean => Boolean(node.children?.length);
  readonly isVdevGroup = (_: number, node: DeviceNestedDataNode): boolean => isVdevGroup(node);

  constructor(
    private layoutService: LayoutService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private devicesStore: DevicesStore,
  ) { }

  getDisk(node: DeviceNestedDataNode): Disk {
    if (isVdevGroup(node) || !isTopologyDisk(node)) {
      return undefined;
    }
    return this.diskDictionary[node.disk];
  }

  ngOnInit(): void {
    this.poolId = Number(this.route.snapshot.paramMap.get('poolId'));
    this.devicesStore.loadNodes(this.poolId);
    this.listenForRouteChanges();
    this.setupTree();

    this.ws
      .call('system.advanced.config')
      .pipe(untilDestroyed(this))
      .subscribe((advancedConfig) => {
        this.hasConsoleFooter = advancedConfig.consolemsg;
      });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
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

  private setupTree(): void {
    this.devicesStore.nodes$
      .pipe(untilDestroyed(this))
      .subscribe(
        (nodes) => {
          this.createDataSource(nodes);
          this.treeControl.dataNodes = nodes;
          this.openGroupNodes();
          this.cdr.markForCheck();

          if (!nodes.length) {
            return;
          }

          const routeGuid = this.route.snapshot.paramMap.get('guid');
          if (routeGuid) {
            this.devicesStore.selectNodeByGuid(routeGuid);
          }
        },
      );

    this.devicesStore.selectedBranch$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((selectedBranch: DeviceNestedDataNode[]) => {
        selectedBranch.forEach((node) => this.treeControl.expand(node));
      });

    this.devicesStore.diskDictionary$
      .pipe(untilDestroyed(this))
      .subscribe((diskDictionary) => {
        this.diskDictionary = diskDictionary;
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

  private openGroupNodes(): void {
    this.treeControl?.dataNodes?.forEach((node) => this.treeControl.expand(node));
  }

  private listenForRouteChanges(): void {
    this.route.params.pipe(
      pluck('guid'),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((guid: string) => {
      this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
      this.devicesStore.selectNodeByGuid(guid);
    });
  }

  // TODO: Likely belongs to DevicesStore
  private sortDataNodesByDiskName(dataNodes: DeviceNestedDataNode[]): void {
    dataNodes.forEach((dataNodes) => {
      if (dataNodes.children.length === 0) {
        return;
      }

      dataNodes.children.sort((a: TopologyDisk, b: TopologyDisk) => {
        const nameA = a.disk.toLowerCase();
        const nameB = b.disk.toLowerCase();

        return nameA.localeCompare(nameB);
      });
      this.sortDataNodesByDiskName(dataNodes.children);
    });
  }
}
