import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, input, output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import {
  ActivatedRoute, Router, RouterLink, RouterLinkActive,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter, map } from 'rxjs/operators';
import { VDevNestedDataNode, isVdevGroup } from 'app/interfaces/device-nested-data-node.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { NestedTreeNodeComponent } from 'app/modules/ix-tree/components/nested-tree-node/nested-tree-node.component';
import { TreeNodeComponent } from 'app/modules/ix-tree/components/tree-node/tree-node.component';
import { TreeViewComponent } from 'app/modules/ix-tree/components/tree-view/tree-view.component';
import { TreeNodeDefDirective } from 'app/modules/ix-tree/directives/tree-node-def.directive';
import { TreeNodeOutletDirective } from 'app/modules/ix-tree/directives/tree-node-outlet.directive';
import { TreeNodeToggleDirective } from 'app/modules/ix-tree/directives/tree-node-toggle.directive';
import { NestedTreeDataSource } from 'app/modules/ix-tree/nested-tree-datasource';
import { createNestedTreeControl } from 'app/modules/ix-tree/tree-control.factory';
import { TreeExpansion } from 'app/modules/ix-tree/tree-expansion.interface';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';
import { TopologyItemNodeComponent } from 'app/pages/storage/modules/vdevs/components/topology-item-node/topology-item-node.component';
import { VDevGroupNodeComponent } from 'app/pages/storage/modules/vdevs/components/vdev-group-node/vdev-group-node.component';
import { VDevsStore } from 'app/pages/storage/modules/vdevs/stores/vdevs-store.service';
import { collectDescendantWarning } from 'app/pages/storage/modules/vdevs/utils/descendant-warning';
import { deviceMatchesSearch } from 'app/pages/storage/modules/vdevs/utils/device-matches-search.utils';
import { findReplacementNode } from 'app/pages/storage/modules/vdevs/utils/find-replacement-node.utils';

@Component({
  selector: 'ix-vdevs-list',
  templateUrl: './vdevs-list.component.html',
  styleUrls: ['./vdevs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TestDirective,
    RouterLink,
    BasicSearchComponent,
    FakeProgressBarComponent,
    FormsModule,
    RouterLinkActive,
    TopologyItemNodeComponent,
    TnIconComponent,
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

  // The path to the last device that was selected. Kept so that when a refresh removes it, for example a replaced
  // disk detached once its resilver finished, what took its place can be selected instead.
  private lastSelectedBranch: VDevNestedDataNode[] | null = null;

  searchQuery = signal('');
  protected isLoading$ = this.vDevsStore.isLoading$;
  protected selectedNode$ = this.vDevsStore.selectedNode$;

  protected dataSource: NestedTreeDataSource<VDevNestedDataNode>;

  protected treeControl: TreeExpansion<VDevNestedDataNode, string> = createNestedTreeControl<
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
    this.vDevsStore.listenForPoolChanges().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
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
      .subscribe((nodes) => this.onNodesLoaded(nodes));

    this.vDevsStore.selectedBranch$
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedBranch: VDevNestedDataNode[]) => {
        this.lastSelectedBranch = selectedBranch;
        selectedBranch.forEach((node) => this.treeControl.expand(node));
      });
  }

  private onNodesLoaded(nodes: VDevNestedDataNode[]): void {
    this.createDataSource(nodes);
    if (this.searchQuery()) {
      // A refresh can happen while the search box still has a query in it.
      this.dataSource.filter(this.searchQuery());
    }
    this.treeControl.dataNodes = nodes;
    this.openGroupNodes();
    this.expandNodesWithDescendantWarning(nodes);
    this.cdr.markForCheck();

    if (!nodes.length) {
      return;
    }

    const routeGuid = this.route.snapshot.paramMap.get('guid');
    if (!routeGuid) {
      return;
    }

    const replacement = this.findReplacement(nodes, routeGuid);
    if (replacement) {
      this.vDevsStore.selectNodeByGuid(replacement.guid);
      this.layoutService.navigatePreservingScroll(
        this.router,
        ['/storage', this.poolId(), 'vdevs', replacement.guid],
        { replaceUrl: true },
      );
      return;
    }

    this.vDevsStore.selectNodeByGuid(routeGuid);
  }

  /** What to select instead of the device in the URL, when it was selected before and is now gone. */
  private findReplacement(nodes: VDevNestedDataNode[], routeGuid: string): VDevNestedDataNode | null {
    const branch = this.lastSelectedBranch;
    if (branch?.at(-1)?.guid !== routeGuid || getTreeBranchToNode(nodes, (node) => node.guid === routeGuid)) {
      return null;
    }

    return findReplacementNode(nodes, branch);
  }

  private createDataSource(dataNodes: VDevNestedDataNode[]): void {
    this.dataSource = new NestedTreeDataSource();
    this.dataSource.filterPredicate = (nodesToFilter, query = '') => {
      return flattenTreeWithFilter(nodesToFilter, (dataNode) => deviceMatchesSearch(dataNode, query));
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

  protected viewDetails(poolId: number, guid: string): void {
    this.showDetails.emit({ poolId, guid });

    this.layoutService.navigatePreservingScroll(this.router, ['/storage', poolId, 'vdevs', guid]);

    this.showMobileDetails.emit(true);
  }
}
