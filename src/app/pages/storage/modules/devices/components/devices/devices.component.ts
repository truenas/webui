import {
  Breakpoints,
  BreakpointState,
  BreakpointObserver,
} from '@angular/cdk/layout';
import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  AfterViewInit,
  TemplateRef,
  ViewChild,
  Inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { DeviceNestedDataNode, isVdevGroup } from 'app/interfaces/device-nested-data-node.interface';
import {
  Disk, isTopologyDisk, isVdev, TopologyDisk,
} from 'app/interfaces/storage.interface';
import { NestedTreeDataSource } from 'app/modules/ix-tree/nested-tree-datasource';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
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
  selectedTopologyCategory$ = this.devicesStore.selectedTopologyCategory$;

  diskDictionary: { [guid: string]: Disk } = {};
  dataSource: NestedTreeDataSource<DeviceNestedDataNode>;
  poolId: number;
  treeControl = new NestedTreeControl<DeviceNestedDataNode, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.guid,
  });

  readonly hasNestedChild = (_: number, node: DeviceNestedDataNode): boolean => Boolean(node.children?.length);
  readonly isVdevGroup = (_: number, node: DeviceNestedDataNode): boolean => isVdevGroup(node);

  showMobileDetails = false;
  isMobileView = false;

  constructor(
    private router: Router,
    private layoutService: LayoutService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private devicesStore: DevicesStore,
    private breakpointObserver: BreakpointObserver,
    @Inject(WINDOW) private window: Window,
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
    this.dataSource = new NestedTreeDataSource(dataNodes);
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
      this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
      this.devicesStore.selectNodeByGuid(guid);
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

  // TODO: Likely belongs to DevicesStore
  private sortDataNodesByDiskName(dataNodes: DeviceNestedDataNode[]): void {
    dataNodes.forEach((node) => {
      if (node.children.length === 0) {
        return;
      }

      node.children.sort((a: TopologyDisk, b: TopologyDisk) => {
        if (a.disk && b.disk) {
          const nameA = a.disk.toLowerCase();
          const nameB = b.disk.toLowerCase();

          return nameA.localeCompare(nameB);
        }
        return undefined;
      });
      this.sortDataNodesByDiskName(node.children);
    });
  }
}
