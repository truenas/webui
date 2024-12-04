import {
  Breakpoints,
  BreakpointState,
  BreakpointObserver,
} from '@angular/cdk/layout';
import { NestedTreeControl } from '@angular/cdk/tree';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  AfterViewInit,
  Inject,
} from '@angular/core';
import { MatAnchor, MatIconButton } from '@angular/material/button';
import {
  ActivatedRoute, Router, RouterLink, RouterLinkActive,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { DeviceNestedDataNode, isVdevGroup } from 'app/interfaces/device-nested-data-node.interface';
import { Disk } from 'app/interfaces/disk.interface';
import {
  isTopologyDisk, isVdev, TopologyDisk, TopologyItem,
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
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DiskDetailsPanelComponent } from 'app/pages/storage/modules/devices/components/disk-details-panel/disk-details-panel.component';
import { TopologyItemNodeComponent } from 'app/pages/storage/modules/devices/components/topology-item-node/topology-item-node.component';
import { VDevGroupNodeComponent } from 'app/pages/storage/modules/devices/components/vdev-group-node/vdev-group-node.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { ApiService } from 'app/services/websocket/api.service';

const raidzItems = [TopologyItemType.Raidz, TopologyItemType.Raidz1, TopologyItemType.Raidz2, TopologyItemType.Raidz3];

@UntilDestroy()
@Component({
  selector: 'ix-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    RequiresRolesDirective,
    MatAnchor,
    TestDirective,
    RouterLink,
    FakeProgressBarComponent,
    SearchInput1Component,
    RouterLinkActive,
    TopologyItemNodeComponent,
    IxIconComponent,
    VDevGroupNodeComponent,
    MatIconButton,
    DetailsHeightDirective,
    DiskDetailsPanelComponent,
    TranslateModule,
    CastPipe,
    AsyncPipe,
    TreeViewComponent,
    TreeNodeComponent,
    NestedTreeNodeComponent,
    TreeNodeDefDirective,
    TreeNodeToggleDirective,
    TreeNodeOutletDirective,
  ],
  providers: [
    DevicesStore,
  ],
})
export class DevicesComponent implements OnInit, AfterViewInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  isLoading$ = this.devicesStore.isLoading$;
  selectedNode$ = this.devicesStore.selectedNode$;
  selectedParentNode$ = this.devicesStore.selectedParentNode$;
  selectedTopologyCategory$ = this.devicesStore.selectedTopologyCategory$;
  disksWithSmartTestSupport$ = this.devicesStore.disksWithSmartTestSupport$;

  diskDictionary: Record<string, Disk> = {};
  dataSource: NestedTreeDataSource<DeviceNestedDataNode>;
  poolId: number;
  poolName: string;

  treeControl = new NestedTreeControl<DeviceNestedDataNode, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.guid,
  });

  readonly hasNestedChild = (_: number, node: DeviceNestedDataNode): boolean => Boolean(node.children?.length);
  readonly isVdevGroup = (_: number, node: DeviceNestedDataNode): boolean => isVdevGroup(node);

  readonly hasTopLevelRaidz$: Observable<boolean> = this.devicesStore.nodes$.pipe(
    map((node) => {
      return node.some((nodeItem) => nodeItem.children.some((child: TopologyItem) => {
        return raidzItems.includes(child.type);
      }));
    }),
  );

  showMobileDetails = false;
  isMobileView = false;

  get pageTitle(): string {
    return this.poolName
      ? this.translate.instant('{name} Devices', { name: this.poolName })
      : this.translate.instant('Devices');
  }

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private devicesStore: DevicesStore,
    private breakpointObserver: BreakpointObserver,
    private translate: TranslateService,
    private api: ApiService,
    @Inject(WINDOW) private window: Window,
  ) { }

  getDisk(node: DeviceNestedDataNode): Disk {
    if (isVdevGroup(node) || !isTopologyDisk(node)) {
      return undefined;
    }
    return this.diskDictionary[node.disk];
  }

  ngOnInit(): void {
    this.devicesStore.loadDisksWithSmartTestSupport();
    this.poolId = Number(this.route.snapshot.paramMap.get('poolId'));
    this.devicesStore.loadNodes(this.poolId);
    this.listenForRouteChanges();
    this.setupTree();
    this.getPool();
  }

  ngAfterViewInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .pipe(untilDestroyed(this))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobileView = true;
        } else {
          this.closeMobileDetails();
          this.isMobileView = false;
        }
        this.cdr.detectChanges();
      });
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

  viewDetails(poolId: number, guid: string): void {
    this.router.navigate(['/storage', poolId, 'devices', guid]);

    if (this.isMobileView) {
      this.showMobileDetails = true;

      // focus on details container
      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }

  closeMobileDetails(): void {
    this.showMobileDetails = false;
  }

  private getPool(): void {
    this.api.call('pool.query', [[['id', '=', this.poolId]]]).pipe(untilDestroyed(this)).subscribe((pools) => {
      if (pools.length) {
        this.poolName = pools[0]?.name;
        this.cdr.markForCheck();
      }
    });
  }
}
