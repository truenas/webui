import { NestedTreeControl } from '@angular/cdk/tree';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  input,
  output,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import {
  ActivatedRoute, Router, RouterLink, RouterLinkActive,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map } from 'rxjs/operators';
import { DeviceNestedDataNode, isVdevGroup } from 'app/interfaces/device-nested-data-node.interface';
import {
  isTopologyDisk, isVdev, TopologyDisk,
} from 'app/interfaces/storage.interface';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { NestedTreeNodeComponent } from 'app/modules/ix-tree/components/nested-tree-node/nested-tree-node.component';
import { TreeNodeComponent } from 'app/modules/ix-tree/components/tree-node/tree-node.component';
import { TreeViewComponent } from 'app/modules/ix-tree/components/tree-view/tree-view.component';
import { TreeNodeDefDirective } from 'app/modules/ix-tree/directives/tree-node-def.directive';
import { TreeNodeOutletDirective } from 'app/modules/ix-tree/directives/tree-node-outlet.directive';
import { TreeNodeToggleDirective } from 'app/modules/ix-tree/directives/tree-node-toggle.directive';
import { NestedTreeDataSource } from 'app/modules/ix-tree/nested-tree-datasource';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TopologyItemNodeComponent } from 'app/pages/storage/modules/devices/components/topology-item-node/topology-item-node.component';
import { VDevGroupNodeComponent } from 'app/pages/storage/modules/devices/components/vdev-group-node/vdev-group-node.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-devices-list',
  templateUrl: './devices-list.component.html',
  styleUrls: ['./devices-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TestDirective,
    RouterLink,
    FakeProgressBarComponent,
    SearchInput1Component,
    RouterLinkActive,
    TopologyItemNodeComponent,
    IxIconComponent,
    VDevGroupNodeComponent,
    MatIconButton,
    TranslateModule,
    AsyncPipe,
    TreeViewComponent,
    TreeNodeComponent,
    NestedTreeNodeComponent,
    CastPipe,
    TreeNodeDefDirective,
    TreeNodeToggleDirective,
    TreeNodeOutletDirective,
  ],
})
export class DevicesListComponent implements OnInit {
  poolId = input.required<number>();
  isMobileView = input<boolean>();
  showMobileDetails = output<boolean>();
  showDetails = output<{ poolId: number; guid: string }>();

  protected isLoading$ = this.devicesStore.isLoading$;
  protected selectedNode$ = this.devicesStore.selectedNode$;

  protected dataSource: NestedTreeDataSource<DeviceNestedDataNode>;

  protected treeControl = new NestedTreeControl<DeviceNestedDataNode, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.guid,
  });

  protected readonly hasNestedChild = (_: number, node: DeviceNestedDataNode): boolean => {
    return Boolean(node.children?.length);
  };

  protected readonly isVdevGroup = (_: number, node: DeviceNestedDataNode): boolean => isVdevGroup(node);

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    protected devicesStore: DevicesStore,
  ) { }

  ngOnInit(): void {
    this.devicesStore.loadDisksWithSmartTestSupport();
    this.devicesStore.loadNodes(this.poolId());
    this.listenForRouteChanges();
    this.setupTree();
  }

  protected onRowGroupSelected(dataNodeSelected: DeviceNestedDataNode, _: MouseEvent): void {
    if (this.treeControl.isExpanded(dataNodeSelected)) {
      this.treeControl.collapse(dataNodeSelected);
    } else {
      this.treeControl.expand(dataNodeSelected);
    }
  }

  protected onSearch(query: string): void {
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
  }

  private createDataSource(dataNodes: DeviceNestedDataNode[]): void {
    this.dataSource = new NestedTreeDataSource();
    this.dataSource.filterPredicate = (nodesToFilter, query = '') => {
      return flattenTreeWithFilter(nodesToFilter, (dataNode) => {
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
    this.dataSource.sortComparer = (nodeA, nodeB) => {
      const topologyDiskA = nodeA as TopologyDisk;
      const topologyDiskB = nodeB as TopologyDisk;
      const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'accent',
      });

      if (topologyDiskA?.disk && topologyDiskB.disk) {
        return collator.compare(topologyDiskA.disk, topologyDiskB.disk);
      }

      return collator.compare(topologyDiskA.name, topologyDiskB.name);
    };
    this.dataSource.data = dataNodes;
  }

  private openGroupNodes(): void {
    this.treeControl?.dataNodes?.forEach((node) => this.treeControl.expand(node));
  }

  private listenForRouteChanges(): void {
    this.route.params.pipe(
      map((params) => params.guid as string),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((guid) => {
      this.devicesStore.selectNodeByGuid(guid);
      this.cdr.markForCheck();
    });
  }

  protected viewDetails(poolId: number, guid: string): void {
    this.showDetails.emit({ poolId, guid });
    this.router.navigate(['/storage', poolId, 'devices', guid]);

    if (this.isMobileView()) {
      this.showMobileDetails.emit(true);
    }
  }
}
