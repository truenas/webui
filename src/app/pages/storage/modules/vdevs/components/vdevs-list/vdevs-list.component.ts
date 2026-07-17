import { CdkTreeModule } from '@angular/cdk/tree';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, input, output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute, Router, RouterLink, RouterLinkActive,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnIconButtonComponent,
  TnIconComponent,
  TnNestedTreeDataSource,
  TnNestedTreeNodeComponent,
  TnTreeComponent,
  TnTreeExpansion,
  TnTreeNodeOutletDirective,
  createNestedTreeControl,
} from '@truenas/ui-components';
import { filter, map } from 'rxjs/operators';
import { VDevNestedDataNode, isVdevGroup } from 'app/interfaces/device-nested-data-node.interface';
import {
  isTopologyDisk, isVdev, TopologyDisk,
} from 'app/interfaces/storage.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TopologyItemNodeComponent } from 'app/pages/storage/modules/vdevs/components/topology-item-node/topology-item-node.component';
import { VDevGroupNodeComponent } from 'app/pages/storage/modules/vdevs/components/vdev-group-node/vdev-group-node.component';
import { VDevsStore } from 'app/pages/storage/modules/vdevs/stores/vdevs-store.service';
import { collectDescendantWarning } from 'app/pages/storage/modules/vdevs/utils/descendant-warning';

@Component({
  selector: 'ix-vdevs-list',
  templateUrl: './vdevs-list.component.html',
  styleUrls: ['./vdevs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    BasicSearchComponent,
    FakeProgressBarComponent,
    FormsModule,
    RouterLinkActive,
    TopologyItemNodeComponent,
    TnIconComponent,
    TnIconButtonComponent,
    VDevGroupNodeComponent,
    TranslateModule,
    AsyncPipe,
    CastPipe,
    CdkTreeModule,
    TnTreeComponent,
    TnNestedTreeNodeComponent,
    TnTreeNodeOutletDirective,
  ],
})
export class VDevsListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected vDevsStore = inject(VDevsStore);
  private layoutService = inject(LayoutService);
  private destroyRef = inject(DestroyRef);

  poolId = input.required<number>();
  showMobileDetails = output<boolean>();
  showDetails = output<{ poolId: number; guid: string }>();

  // GUIDs we've already auto-expanded because of a descendant warning. Tracked so a user
  // collapse sticks across `nodes$` refreshes — we only auto-expand a given node once.
  private readonly autoExpandedGuids = new Set<string>();

  searchQuery = signal('');
  protected isLoading$ = this.vDevsStore.isLoading$;
  protected selectedNode$ = this.vDevsStore.selectedNode$;

  protected dataSource: TnNestedTreeDataSource<VDevNestedDataNode>;

  protected treeControl: TnTreeExpansion<VDevNestedDataNode, string> = createNestedTreeControl<
    VDevNestedDataNode,
    string
  >(
    (vdev) => vdev.children,
    { trackBy: (vdev) => vdev.guid },
  );

  protected readonly hasNestedChild = (_: number, node: VDevNestedDataNode): boolean => {
    return Boolean(node.children?.length);
  };

  protected readonly isVdevGroup = (_: number, node: VDevNestedDataNode): boolean => isVdevGroup(node);

  ngOnInit(): void {
    this.vDevsStore.loadNodes(this.poolId());
    this.listenForRouteChanges();
    this.setupTree();
  }

  protected onRowGroupSelected(dataNodeSelected: VDevNestedDataNode, _: MouseEvent): void {
    if (this.treeControl.isExpanded(dataNodeSelected)) {
      this.treeControl.collapse(dataNodeSelected);
    } else {
      this.treeControl.expand(dataNodeSelected);
    }
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataSource.filter(query);
  }

  private setupTree(): void {
    this.vDevsStore.nodes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        (nodes) => {
          this.createDataSource(nodes);
          this.treeControl.dataNodes = nodes;
          this.openGroupNodes();
          this.expandNodesWithDescendantWarning(nodes);
          this.cdr.markForCheck();

          if (!nodes.length) {
            return;
          }

          const routeGuid = this.route.snapshot.paramMap.get('guid');
          if (routeGuid) {
            this.vDevsStore.selectNodeByGuid(routeGuid);
          }
        },
      );

    this.vDevsStore.selectedBranch$
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedBranch: VDevNestedDataNode[]) => {
        selectedBranch.forEach((node) => this.treeControl.expand(node));
      });
  }

  private createDataSource(dataNodes: VDevNestedDataNode[]): void {
    this.dataSource = new TnNestedTreeDataSource();
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

  // Expand any VDEV whose subtree contains a non-optimal disk so a failing child isn't hidden
  // behind a collapsed parent row. Each GUID is only auto-expanded once (see autoExpandedGuids)
  // so a subsequent user collapse isn't undone when the store re-emits.
  private expandNodesWithDescendantWarning(nodes: VDevNestedDataNode[]): void {
    for (const node of nodes) {
      if (isVdevGroup(node)) {
        this.expandNodesWithDescendantWarning(node.children);
        continue;
      }
      if (!this.autoExpandedGuids.has(node.guid) && collectDescendantWarning(node).count > 0) {
        this.treeControl.expand(node);
        this.autoExpandedGuids.add(node.guid);
      }
      if (node.children?.length) {
        this.expandNodesWithDescendantWarning(node.children);
      }
    }
  }

  private listenForRouteChanges(): void {
    this.route.params.pipe(
      map((params) => params.guid as string),
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((guid) => {
      this.vDevsStore.selectNodeByGuid(guid);
      this.cdr.markForCheck();
    });
  }

  /**
   * Row-level Enter handler. The built-in toggle button does not stop Enter
   * propagation (the legacy custom toggle did), so only navigate when the
   * event originated on the row itself — not on the toggle inside it.
   */
  protected onRowEnter(event: Event, guid: string): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    this.viewDetails(this.poolId(), guid);
  }

  protected viewDetails(poolId: number, guid: string): void {
    this.showDetails.emit({ poolId, guid });

    this.layoutService.navigatePreservingScroll(this.router, ['/storage', poolId, 'vdevs', guid]);

    this.showMobileDetails.emit(true);
  }
}
