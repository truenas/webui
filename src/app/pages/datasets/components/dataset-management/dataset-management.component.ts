import {
  Breakpoints,
  BreakpointState,
  BreakpointObserver,
} from '@angular/cdk/layout';
import { CdkTreeNodePadding, CdkTreeNodeDef } from '@angular/cdk/tree';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, Injector, OnInit, AfterViewInit,
  TrackByFunction, computed, effect, inject, signal, untracked, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute, NavigationSkipped, NavigationStart, Router,
  RouterLink, RouterLinkActive,
} from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnIconComponent, TnTreeVirtualScrollViewComponent, TnTreeNodeComponent, TnEmptyComponent, type IconLibraryType,
  TnTreeFlatDataSource, TnTreeFlattener, type TnTreeExpansion, createFlatTreeControl,
} from '@truenas/ui-components';
import { uniqBy } from 'lodash-es';
import { filter, map } from 'rxjs/operators';
import { datasetEmptyConfig, noSearchResultsConfig } from 'app/constants/empty-configs';
import { ContentVirtualScrollableDirective } from 'app/directives/content-virtual-scrollable/content-virtual-scrollable.directive';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetDetailsPanelComponent } from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.component';
import { datasetManagementElements } from 'app/pages/datasets/components/dataset-management/dataset-management.elements';
import { DatasetNodeComponent } from 'app/pages/datasets/components/dataset-node/dataset-node.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { datasetNameSortComparer } from 'app/pages/datasets/utils/dataset.utils';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';

@Component({
  selector: 'ix-dataset-management',
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.details-overlay]': 'showMobileDetails' },
  imports: [
    TnEmptyComponent,
    FakeProgressBarComponent,
    ContentVirtualScrollableDirective,
    BasicSearchComponent,
    DatasetNodeComponent,
    TnIconComponent,
    RouterLink,
    CdkTreeNodePadding,
    DetailsHeightDirective,
    DatasetDetailsPanelComponent,
    TranslateModule,
    TnTreeVirtualScrollViewComponent,
    TnTreeNodeComponent,
    CdkTreeNodeDef,
    RouterLinkActive,
    NgTemplateOutlet,
  ],
})
export class DatasetsManagementComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private activatedRoute = inject(ActivatedRoute);
  private datasetStore = inject(DatasetTreeStore);
  private router = inject(Router);
  protected translate = inject(TranslateService);
  private breakpointObserver = inject(BreakpointObserver);
  private searchDirectives = inject(UiSearchDirectivesService);
  private layoutService = inject(LayoutService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private sharingTierService = inject(SharingTierService);
  private authService = inject(AuthService);

  protected tierEnabled = this.sharingTierService.tierEnabled;
  private hasDatasetWrite = toSignal(this.authService.hasRole([Role.DatasetWrite]), { initialValue: false });

  private readonly ixTreeHeader = viewChild<ElementRef<HTMLElement>>('ixTreeHeader');
  private readonly ixTree = viewChild<ElementRef<HTMLElement>>('ixTree');
  private treeHeaderEl: HTMLElement | null = null;

  // Row geometry the scrollable width below is built from. These mirror the row grid in
  // dataset-node.component.scss and the node chrome this component's stylesheet overrides
  // — keep them in step with those rules.
  /** `[cdkTreeNodePaddingIndent]`: how far each tree level indents a row. */
  protected readonly treeIndentPerLevel = 40;
  /** `.tn-tree-node__content`'s left padding (9px) plus the expand-toggle column (24px). */
  private readonly rowContentOffset = 33;
  /** The four fixed value columns (4 × 100px) plus the row grid's four 8px gaps. */
  private readonly valueColumnsWidth = 432;
  /** Floor for the name column, so the deepest row's name can't be squeezed to nothing. */
  private readonly minNameColumnWidth = 150;

  /**
   * Width of the tree's scrollable content, fed to `--ix-tree-content-width` to reserve the scroll range
   * and stretch the sticky header. Derived from the deepest visible level, not measured from rendered
   * rows: the tree is virtualized, so measuring let the range shrink while scrolling and snap
   * `scrollLeft` back to 0, hiding the Usage column.
   */
  protected readonly treeContentWidth = signal<string | null>(null);

  protected readonly requiredRoles = [Role.DatasetWrite];
  protected readonly searchableElements = datasetManagementElements;
  protected readonly searchQuery = signal('');

  protected readonly isLoading = this.datasetStore.isLoading;
  protected readonly selectedDataset = this.datasetStore.selectedDataset;
  showMobileDetails = false;
  isMobileView = false;
  systemDataset = toSignal(this.api.call('systemdataset.config').pipe(map((config) => config.pool)));

  protected readonly error = this.datasetStore.error;
  private readonly routeDatasetId = toSignal(
    this.activatedRoute.params.pipe(map((params) => params.datasetId as string | undefined)),
  );

  emptyConfig = computed<EmptyConfig>(() => {
    const error = this.error();

    const apiError = extractApiErrorDetails(error);
    if (apiError?.reason) {
      return {
        type: EmptyType.Errors,
        large: true,
        title: this.translate.instant('Failed to load datasets'),
        message: this.translate.instant(apiError.reason || apiError?.error?.toString()),
        button: {
          label: this.translate.instant('Retry'),
          action: () => this.datasetStore.loadDatasets(),
        },
      };
    }

    if (this.searchQuery()?.length && !this.dataSource.filteredData.length) {
      return {
        ...noSearchResultsConfig,
        title: this.translate.instant(noSearchResultsConfig.title),
        message: noSearchResultsConfig.message && this.translate.instant(noSearchResultsConfig.message),
      };
    }

    return {
      ...datasetEmptyConfig,
      title: this.translate.instant(datasetEmptyConfig.title),
      message: datasetEmptyConfig.message && this.translate.instant(datasetEmptyConfig.message),
      button: {
        label: this.translate.instant('Create Pool'),
        action: () => this.createPool(),
      },
    };
  });

  protected readonly emptyIcon = computed<{ name: string; library: IconLibraryType }>(() => {
    switch (this.emptyConfig().type) {
      case EmptyType.Errors:
        return { name: 'alert-octagon', library: 'mdi' };
      case EmptyType.NoSearchResults:
        return { name: 'magnify-scan', library: 'mdi' };
      default:
        return { name: 'dataset-root', library: 'custom' };
    }
  });

  // The empty-state action (Retry / Create Pool) is gated on DatasetWrite, mirroring
  // the role gating the previous `ix-empty [requiredRoles]` applied to its button.
  protected readonly emptyActionText = computed<string | undefined>(() => {
    if (!this.hasDatasetWrite()) {
      return undefined;
    }
    return this.emptyConfig().button?.label;
  });

  protected onEmptyAction(): void {
    this.emptyConfig().button?.action?.();
  }

  // Flat API
  getLevel = (dataset: DatasetDetails): number => (dataset?.name?.split('/')?.length || 0) - 1;
  isExpandable = (dataset: DatasetDetails): boolean => Number(dataset?.children?.length) > 0;
  treeControl: TnTreeExpansion<DatasetDetails, string> = createFlatTreeControl<DatasetDetails, string>(
    this.getLevel,
    this.isExpandable,
    { trackBy: (dataset: DatasetDetails) => dataset.id },
  );

  treeFlattener = new TnTreeFlattener<DatasetDetails, DatasetDetails>(
    (dataset) => dataset,
    this.getLevel,
    this.isExpandable,
    () => [],
  );

  dataSource = new TnTreeFlatDataSource(this.treeControl, this.treeFlattener);
  trackById: TrackByFunction<DatasetDetails> = (index: number, dataset: DatasetDetails): string => dataset?.id;

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationSkipped || event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.closeMobileDetails());
  }

  ngOnInit(): void {
    this.datasetStore.loadDatasets();
    // The effects below are created after the load starts: the store outlives this page, and their
    // first run should see this visit's load rather than whatever the last visit left behind.
    this.setupTree();
    this.listenForRouteChanges();
    this.listenForLoading();
    // Fetched again on each visit: tiering can be changed outside this tab.
    this.sharingTierService.refresh();
    this.sharingTierService.getTierConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
    this.listenForTierJobs();
  }

  ngAfterViewInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobileView = true;
        } else {
          this.closeMobileDetails();
          this.isMobileView = false;
        }
        this.cdr.markForCheck();
      });
  }

  /**
   * Refreshes the tree when a tier rewrite job appears, changes status or ends, since the details card's
   * own reload can beat the job into `pool.dataset.details`. `refreshDatasets`, because a load would
   * unmount the details panel. The topic only carries these transitions; progress is on the per-job
   * topic this page doesn't follow, so a running migration can't cause a refresh loop.
   */
  private listenForTierJobs(): void {
    this.sharingTierService.wireTierJobRefresh({
      destroyRef: this.destroyRef,
      reload: () => this.datasetStore.refreshDatasets(),
    });
  }

  private listenForLoading(): void {
    effect(() => {
      if (!this.isLoading()) {
        untracked(() => setTimeout(() => this.handlePendingGlobalSearchElement(), searchDelayConst * 2));
      }
    }, { injector: this.injector });
  }

  protected isSystemDataset(dataset: DatasetDetails): boolean {
    return dataset.name.split('/').length === 1 && this.systemDataset() === dataset.name;
  }

  /**
   * Widest row the tree can show = the deepest visible indent plus everything a row always
   * needs. Recomputed only when the shown nodes change (new data, expand/collapse), never
   * while scrolling — see {@link treeContentWidth}.
   *
   * Filtering is not a trigger on purpose: it can only remove nodes, so the visible depth
   * can only shrink, and a width left over from the unfiltered tree stays a safe (never
   * too small) reservation that is already correct again once the search is cleared.
   */
  private updateTreeContentWidth(): void {
    const width = this.maxVisibleLevel() * this.treeIndentPerLevel
      + this.rowContentOffset + this.valueColumnsWidth + this.minNameColumnWidth;

    this.treeContentWidth.set(`${width}px`);
  }

  /** Deepest level among the nodes the tree actually renders — collapsed subtrees skipped. */
  private maxVisibleLevel(): number {
    const nodes = this.treeControl.dataNodes || [];
    let maxLevel = 0;
    // The nodes are in depth-first order, so everything deeper than a collapsed node and
    // ahead of it is that node's hidden descendants. Infinity while nothing is collapsed.
    let collapsedAtLevel = Number.POSITIVE_INFINITY;

    for (const node of nodes) {
      const level = this.getLevel(node);
      if (level > collapsedAtLevel) {
        continue;
      }

      collapsedAtLevel = this.treeControl.isExpanded(node) ? Number.POSITIVE_INFINITY : level;
      maxLevel = Math.max(maxLevel, level);
    }

    return maxLevel;
  }

  // Keep the sticky column header scrolled to the same horizontal offset as the rows, so
  // the header labels track the columns as you scroll right. The tree scrolls VERTICALLY
  // with the page (.rightside-content-hold); its own `.tree-wrapper` (overflow: auto) owns
  // only the HORIZONTAL scroll, so the header is synced to the wrapper's scrollLeft.
  protected datasetTreeWrapperScrolled(): void {
    const tree = this.ixTree()?.nativeElement;
    // Cache the header element to avoid a DOM query on every scroll event; re-query only
    // if the cached node was detached (e.g. the tree re-rendered).
    if (!this.treeHeaderEl?.isConnected) {
      this.treeHeaderEl = this.ixTreeHeader()?.nativeElement?.querySelector<HTMLElement>('.tree-header') ?? null;
    }
    const treeHeader = this.treeHeaderEl;
    if (tree && treeHeader) {
      // Shift the header via transform (not scrollLeft): the sticky header keeps the
      // mixin's `overflow: visible` so it isn't collapsed, and translateX tracks the
      // wrapper's horizontal scroll to keep the column labels above their rows.
      treeHeader.style.transform = `translateX(${-tree.scrollLeft}px)`;
    }
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataSource.filter(query);
    this.cdr.markForCheck();
  }

  protected closeMobileDetails(): void {
    this.showMobileDetails = false;
    this.cdr.markForCheck();
  }

  protected createPool(): void {
    this.router.navigate(['/storage', 'create']);
  }

  protected viewDetails(dataset: DatasetDetails): void {
    this.layoutService.navigatePreservingScroll(this.router, ['/datasets', dataset.id]);

    if (this.isMobileView) {
      this.showMobileDetails = true;

      // focus on details container
      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')?.[0] as HTMLElement)?.focus(), 0);
    }
  }

  private setupTree(): void {
    effect(() => {
      const datasets = this.datasetStore.datasets();
      untracked(() => {
        this.createDataSource(datasets);
        this.expandDatasetBranch();
        this.updateTreeContentWidth();
        this.cdr.markForCheck();
      });
    }, { injector: this.injector });

    this.treeControl.expansionModel.changed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateTreeContentWidth();
        this.cdr.markForCheck();
      });

    effect(() => {
      const selectedBranch = this.datasetStore.selectedBranch();
      if (!selectedBranch) {
        return;
      }

      untracked(() => {
        selectedBranch.forEach((datasetFromSelectedBranch) => {
          const expandedDataset = this.treeControl.dataNodes
            .find((dataset) => dataset.id === datasetFromSelectedBranch.id);

          if (expandedDataset) {
            this.treeControl.expand(expandedDataset);
          }
        });
      });
    }, { injector: this.injector });
  }

  private createDataSource(datasets: DatasetDetails[]): void {
    // Reuse the SAME data-source instance across dataset reloads and only update its
    // data. Replacing the instance makes CdkTree switch/disconnect the previous source,
    // which permanently tears down its debounced filter subscription
    // (takeUntil(disconnect$)) and silently breaks the search box. The tree itself is
    // also kept mounted (see the template) for the same reason.
    if (!this.dataSource.filterPredicate) {
      this.dataSource.filterPredicate = (datasetsToFilter, query = '') => {
        const result: DatasetDetails[] = [];

        const datasetsMatched = datasetsToFilter
          .filter((dataset) => dataset.name.toLowerCase().includes(query.toLowerCase()));

        datasetsMatched.forEach((dataset) => {
          const paths = dataset.id.split('/');

          for (let i = 1; i <= paths.length; i++) {
            const matched = datasetsToFilter.find((parent) => parent.id === paths.slice(0, i).join('/'));
            if (matched) {
              result.push(matched);
            }
          }
        });

        return uniqBy(result, 'id');
      };
      this.dataSource.sortComparer = datasetNameSortComparer;
    }
    this.dataSource.data = datasets;
  }

  private expandDatasetBranch(): void {
    const routeDatasetId = this.activatedRoute.snapshot.paramMap.get('datasetId');
    if (routeDatasetId) {
      this.datasetStore.selectDatasetById(routeDatasetId);
    } else {
      const firstNode = this.treeControl.dataNodes[0];
      if (firstNode) {
        this.router.navigate(['/datasets', firstNode.id]);
      }
    }
  }

  private listenForRouteChanges(): void {
    effect(() => {
      const routeDatasetId = this.routeDatasetId();
      const datasets = this.datasetStore.datasets();

      untracked(() => {
        const selectedDataset = datasets.find((dataset) => dataset.id === routeDatasetId);
        if (!selectedDataset && datasets.length) {
          this.router.navigate(['/datasets', datasets[0]?.id], { replaceUrl: true });
        }

        const datasetId = selectedDataset ? routeDatasetId : datasets[0]?.id;
        if (datasetId) {
          this.datasetStore.selectDatasetById(datasetId);
        }
      });
    }, { injector: this.injector });
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }
}
