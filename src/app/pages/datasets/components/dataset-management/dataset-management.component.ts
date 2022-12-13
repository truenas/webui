import {
  Breakpoints,
  BreakpointState,
  BreakpointObserver,
} from '@angular/cdk/layout';
import { ComponentPortal } from '@angular/cdk/portal';
import { DEFAULT_SCROLL_TIME, DEFAULT_RESIZE_TIME } from '@angular/cdk/scrolling';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Inject,
  TemplateRef,
  Injector,
} from '@angular/core';
import {
  ActivatedRoute, NavigationStart, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ResizedEvent } from 'angular-resize-event';
import { Subject, Subscription } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
} from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxFlatTreeDataSource } from 'app/modules/ix-tree/ix-flat-tree-datasource';
import { IxTreeFlattener } from 'app/modules/ix-tree/ix-tree-flattener';
import { findInTree } from 'app/modules/ix-tree/utils/find-in-tree.utils';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { DatasetNodeComponent } from 'app/pages/datasets/components/dataset-node/dataset-node.component';
import { datasetToken, isSystemDatasetToken } from 'app/pages/datasets/components/dataset-node/dataset-node.token';
import { ImportDataComponent } from 'app/pages/datasets/components/import-data/import-data.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { getDatasetLabel } from 'app/pages/datasets/utils/dataset.utils';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { AppState } from 'app/store';
import { selectHaStatus } from 'app/store/ha-info/ha-info.selectors';

export interface FlatNode {
  id: string;
  name: string;
  level: number;
  expandable: boolean;
}

enum ScrollType {
  IxTree = 'ixTree',
  IxTreeHeader = 'ixTreeHeader',
}

@UntilDestroy()
@Component({
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetsManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  @ViewChild('ixTreeHeader', { static: false }) ixTreeHeader: ElementRef;
  @ViewChild('ixTree', { static: false }) ixTree: ElementRef;

  hasHa$ = this.store$.select(selectHaStatus).pipe(filter(Boolean), map((state) => state.hasHa));

  isLoading$ = this.datasetStore.isLoading$;
  selectedDataset$ = this.datasetStore.selectedDataset$;
  showMobileDetails = false;
  isMobileView = false;
  systemDataset: string;
  isLoading = true;
  subscription = new Subscription();
  scrollTypes = ScrollType;
  ixTreeHeaderWidth: number | null = null;
  treeWidthChange$ = new Subject<ResizedEvent>();

  entityEmptyConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No Datasets'),
    message: `${this.translate.instant(
      "It seems you haven't configured pools yet.",
    )} ${this.translate.instant(
      'Please click the button below to create a pool.',
    )}`,
    button: {
      label: this.translate.instant('Create pool'),
      action: () => this.createPool(),
    },
  };

  private readonly scrollSubject = new Subject<number>();

  // Flat Tree with Virtual Scroll
  readonly hasChild = (_: number, dataNode: FlatNode): boolean => dataNode.expandable;
  private transformer = (dataset: DatasetDetails, level: number): FlatNode => ({
    expandable: Boolean(dataset?.children.length),
    name: getDatasetLabel(dataset),
    id: dataset.id,
    level,
  });
  treeControl = new FlatTreeControl<FlatNode>(
    (dataNode) => dataNode.level,
    (dataNode) => dataNode.expandable,
  );
  treeFlattener = new IxTreeFlattener(
    this.transformer,
    (dataNode) => dataNode.level,
    (dataNode) => dataNode.expandable,
    (dataNode) => dataNode.children,
  );
  dataSource: IxFlatTreeDataSource<DatasetDetails, FlatNode>;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private datasetStore: DatasetTreeStore,
    private router: Router,
    protected translate: TranslateService,
    private dialogService: DialogService,
    private breakpointObserver: BreakpointObserver,
    private layoutService: LayoutService,
    private slideIn: IxSlideInService,
    private store$: Store<AppState>,
    @Inject(WINDOW) private window: Window,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart), untilDestroyed(this))
      .subscribe(() => {
        this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
        if (this.router.getCurrentNavigation().extras.state?.hideMobileDetails) {
          this.closeMobileDetails();
        }
      });
  }

  ngOnInit(): void {
    this.datasetStore.loadDatasets();
    this.loadSystemDatasetConfig();
    this.setupTree();
    this.listenForRouteChanges();
    this.listenForLoading();
    this.listenForDatasetScrolling();
    this.listenForTreeResizing();
  }

  private setupTree(): void {
    this.datasetStore.datasets$.pipe(untilDestroyed(this)).subscribe({
      next: (datasets) => {
        this.sortDatasetsByName(datasets);
        this.createDataSource(datasets);
        this.cdr.markForCheck();
      },
      error: this.handleError,
    });

    this.datasetStore.selectedBranch$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe({
        next: (selectedBranch: DatasetDetails[]) => {
          selectedBranch.forEach((dataset) => this.treeControl.expand(this.getNode(dataset)));
        },
        error: this.handleError,
      });
  }

  private sortDatasetsByName(datasets: DatasetDetails[]): void {
    datasets.forEach((dataset) => {
      if (dataset.children.length > 0) {
        dataset.children.sort((a, b) => {
          const na = a.name.toLowerCase();
          const nb = b.name.toLowerCase();

          if (na < nb) return -1;
          if (na > nb) return 1;

          return 0;
        });
        this.sortDatasetsByName(dataset.children);
      }
    });
  }

  private createDataSource(datasets: DatasetDetails[]): void {
    this.dataSource = new IxFlatTreeDataSource(this.treeControl, this.treeFlattener, datasets);
    this.dataSource.filterPredicate = (datasetsToFilter, query = '') => {
      return flattenTreeWithFilter(datasetsToFilter, (dataset) => {
        return dataset.name.toLowerCase().includes(query.toLowerCase());
      });
    };
    this.expandDatasetBranch();
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
        map((params) => params.datasetId),
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe((datasetId: string) => {
        this.datasetStore.selectDatasetById(datasetId);
      });
  }

  loadSystemDatasetConfig(): void {
    this.ws
      .call('systemdataset.config')
      .pipe(
        map((config) => config.pool),
        untilDestroyed(this),
      )
      .subscribe({
        next: (systemDataset) => {
          this.systemDataset = systemDataset;
        },
        error: this.handleError,
      });
  }

  listenForLoading(): void {
    this.isLoading$.pipe(untilDestroyed(this)).subscribe((isLoading) => {
      this.isLoading = isLoading;
      this.cdr.markForCheck();
    });
  }

  private listenForDatasetScrolling(): void {
    this.subscription.add(
      this.scrollSubject
        .pipe(debounceTime(DEFAULT_SCROLL_TIME), distinctUntilChanged(), untilDestroyed(this))
        .subscribe({
          next: (scrollLeft: number) => {
            this.ixTreeHeader.nativeElement.scrollLeft = scrollLeft;
            this.ixTree.nativeElement.scrollLeft = scrollLeft;
          },
        }),
    );
  }

  private listenForTreeResizing(): void {
    this.subscription.add(
      this.treeWidthChange$
        .pipe(debounceTime(DEFAULT_RESIZE_TIME), distinctUntilChanged(), untilDestroyed(this))
        .subscribe({
          next: (event: ResizedEvent) => {
            this.ixTreeHeaderWidth = Math.round(event.newRect.width);
          },
        }),
    );
  }

  handleError = (error: WebsocketError | Job): void => {
    this.dialogService.errorReportMiddleware(error);
  };

  isSystemDataset(dataset: FlatNode): boolean {
    return dataset.level === 0 && this.systemDataset === dataset.name;
  }

  updateScroll(type: ScrollType): void {
    switch (type) {
      case ScrollType.IxTree:
        this.scrollSubject.next(this.ixTree.nativeElement.scrollLeft);
        break;
      case ScrollType.IxTreeHeader:
        this.scrollSubject.next(this.ixTreeHeader.nativeElement.scrollLeft);
        break;
      default:
        console.warn('Unhandled scroll type.');
        break;
    }
  }

  onIxTreeWidthChange(event: ResizedEvent): void {
    this.treeWidthChange$.next(event);
  }

  onSearch(query: string): void {
    this.dataSource.filter(query);
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
        this.cdr.markForCheck();
      });
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  closeMobileDetails(): void {
    this.showMobileDetails = false;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  createPool(): void {
    this.router.navigate(['/storage', 'create']);
  }

  viewDetails(dataset: FlatNode): void {
    this.router.navigate(['/datasets', dataset.id]);

    if (this.isMobileView) {
      this.showMobileDetails = true;

      // focus on details container
      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }

  onImportData(): void {
    this.slideIn.open(ImportDataComponent);
  }

  getDatasetNodePortal(dataset: FlatNode): ComponentPortal<DatasetNodeComponent> {
    const portalInjector = Injector.create({
      providers: [
        { provide: datasetToken, useValue: this.getDatasetDetails(dataset) },
        { provide: isSystemDatasetToken, useValue: this.systemDataset === dataset.name },
      ],
    });

    return new ComponentPortal(DatasetNodeComponent, null, portalInjector);
  }

  getNode(dataset: DatasetDetails): FlatNode {
    return this.treeControl.dataNodes.find((node) => node.id === dataset.id);
  }

  getDatasetDetails(dataNode: FlatNode): DatasetDetails {
    return findInTree(this.dataSource.data, (dataset) => dataset.id === dataNode.id);
  }
}
