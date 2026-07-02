import {
  Breakpoints,
  BreakpointState,
  BreakpointObserver,
} from '@angular/cdk/layout';
import { CdkTreeNodePadding, CdkTreeNodeDef } from '@angular/cdk/tree';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, OnInit, AfterViewInit, TrackByFunction, HostBinding, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute, NavigationSkipped, NavigationStart, Router,
  RouterLink, RouterLinkActive,
} from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnIconComponent, TnTreeVirtualScrollViewComponent, TnTreeNodeComponent, TnEmptyComponent, type IconLibraryType,
} from '@truenas/ui-components';
import { uniqBy } from 'lodash-es';
import {
  filter,
  map,
  switchMap,
} from 'rxjs/operators';
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
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { createFlatTreeControl } from 'app/modules/ix-tree/tree-control.factory';
import { TreeDataSource } from 'app/modules/ix-tree/tree-datasource';
import { TreeExpansion } from 'app/modules/ix-tree/tree-expansion.interface';
import { TreeFlattener } from 'app/modules/ix-tree/tree-flattener';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetDetailsPanelComponent } from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.component';
import { datasetManagementElements } from 'app/pages/datasets/components/dataset-management/dataset-management.elements';
import { DatasetNodeComponent } from 'app/pages/datasets/components/dataset-node/dataset-node.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { datasetNameSortComparer } from 'app/pages/datasets/utils/dataset.utils';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-dataset-management',
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    AsyncPipe,
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
  private errorHandler = inject(ErrorHandlerService);
  private breakpointObserver = inject(BreakpointObserver);
  private searchDirectives = inject(UiSearchDirectivesService);
  private layoutService = inject(LayoutService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);
  private sharingTierService = inject(SharingTierService);
  private emptyService = inject(EmptyService);
  private authService = inject(AuthService);

  protected tierEnabled = this.sharingTierService.tierEnabled;
  private hasDatasetWrite = toSignal(this.authService.hasRole([Role.DatasetWrite]), { initialValue: false });

  private readonly ixTreeHeader = viewChild<ElementRef<HTMLElement>>('ixTreeHeader');
  private readonly ixTree = viewChild<ElementRef<HTMLElement>>('ixTree');
  // Width the sticky header is stretched to (the tree's full horizontally-scrollable
  // content width) so its columns line up with the rows and scroll along with them.
  protected ixTreeHeaderWidth: number | null = null;

  protected readonly requiredRoles = [Role.DatasetWrite];
  protected readonly searchableElements = datasetManagementElements;
  protected readonly searchQuery = signal('');

  isLoading$ = this.datasetStore.isLoading$;
  selectedDataset$ = this.datasetStore.selectedDataset$;
  @HostBinding('class.details-overlay') showMobileDetails = false;
  isMobileView = false;
  systemDataset = toSignal(this.api.call('systemdataset.config').pipe(map((config) => config.pool)));
  isLoading = true;

  error = toSignal(this.datasetStore.error$);

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
      return noSearchResultsConfig;
    }

    return {
      ...datasetEmptyConfig,
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
  treeControl: TreeExpansion<DatasetDetails, string> = createFlatTreeControl<DatasetDetails, string>(
    this.getLevel,
    this.isExpandable,
    { trackBy: (dataset: DatasetDetails) => dataset.id },
  );

  treeFlattener = new TreeFlattener<DatasetDetails, DatasetDetails, string>(
    (dataset) => dataset,
    this.getLevel,
    this.isExpandable,
    () => [],
  );

  dataSource = new TreeDataSource(this.treeControl, this.treeFlattener);
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
    this.setupTree();
    this.listenForRouteChanges();
    this.listenForLoading();
    this.sharingTierService.getTierConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
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

  private listenForLoading(): void {
    this.isLoading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isLoading) => {
      this.isLoading = isLoading;
      this.cdr.markForCheck();

      if (!isLoading) {
        setTimeout(() => this.handlePendingGlobalSearchElement(), searchDelayConst * 2);
      }
    });
  }

  protected isSystemDataset(dataset: DatasetDetails): boolean {
    return dataset.name.split('/').length === 1 && this.systemDataset() === dataset.name;
  }

  // Keep the sticky column header the same width as the tree's scrollable content and
  // scrolled to the same horizontal offset, so the header labels track the columns as you
  // scroll right. The tree scrolls VERTICALLY with the page (.rightside-content-hold); its
  // own `.tree-wrapper` (overflow: auto) owns only the HORIZONTAL scroll, so the header is
  // synced to the wrapper's scrollLeft.
  private syncHeaderWidth(): void {
    const viewport = this.ixTree()?.nativeElement?.querySelector<HTMLElement>('cdk-virtual-scroll-viewport');
    if (viewport) {
      this.ixTreeHeaderWidth = viewport.scrollWidth;
    }
  }

  protected datasetTreeWrapperScrolled(): void {
    const tree = this.ixTree()?.nativeElement;
    const treeHeader = this.ixTreeHeader()?.nativeElement?.querySelector<HTMLElement>('.tree-header');
    if (tree && treeHeader) {
      // Shift the header via transform (not scrollLeft): the sticky header keeps the
      // mixin's `overflow: visible` so it isn't collapsed, and translateX tracks the
      // wrapper's horizontal scroll to keep the column labels above their rows.
      treeHeader.style.transform = `translateX(${-tree.scrollLeft}px)`;
    }
  }

  protected datasetTreeWidthChanged(): void {
    this.syncHeaderWidth();
    this.cdr.markForCheck();
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
    this.datasetStore.datasets$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (datasets) => {
        this.createDataSource(datasets);
        this.expandDatasetBranch();
        this.cdr.markForCheck();
      },
      error: (error: unknown) => this.errorHandler.showErrorModal(error),
    });

    this.datasetStore.selectedBranch$
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (selectedBranch: DatasetDetails[]) => {
          selectedBranch.forEach((datasetFromSelectedBranch) => {
            const expandedDataset = this.treeControl.dataNodes
              .find((dataset) => dataset.id === datasetFromSelectedBranch.id);

            if (expandedDataset) {
              this.treeControl.expand(expandedDataset);
            }
          });
        },
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
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
    this.activatedRoute.params
      .pipe(
        switchMap((params) => {
          return this.datasetStore.datasets$.pipe(
            map((datasets) => {
              const selectedDataset = datasets.find((dataset) => dataset.id === params.datasetId);
              if (!selectedDataset && datasets.length) {
                this.router.navigate(['/datasets', datasets[0]?.id], { replaceUrl: true });
              }
              return selectedDataset ? params.datasetId as string : datasets[0]?.id;
            }),
          );
        }),
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((datasetId) => {
        this.datasetStore.selectDatasetById(datasetId);
      });
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }
}
