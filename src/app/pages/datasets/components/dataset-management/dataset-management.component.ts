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
  OnDestroy,
  ViewChild,
  ElementRef,
  Inject,
  TemplateRef,
} from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
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
import { WINDOW } from 'app/helpers/window.helper';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  EmptyConfig,
  EmptyType,
} from 'app/modules/entity/entity-empty/entity-empty.component';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { ImportDataComponent } from 'app/pages/datasets/components/import-data/import-data.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { datasetNameSortComparer, isRootDataset } from 'app/pages/datasets/utils/dataset.utils';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { AppState } from 'app/store';
import { selectHaStatus, selectIsSystemHaCapable } from 'app/store/system-info/system-info.selectors';

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

  isSystemHaCapable$ = this.store$.select(selectIsSystemHaCapable);

  isLoading$ = this.datasetStore.isLoading$;
  selectedDataset$ = this.datasetStore.selectedDataset$;
  dataSource: IxNestedTreeDataSource<DatasetDetails>;
  treeControl = new NestedTreeControl<DatasetDetails, string>(
    (dataset) => dataset.children,
    { trackBy: (dataset) => dataset.id },
  );

  showMobileDetails = false;
  isMobileView = false;
  systemDataset: string;
  isLoading = true;
  subscription = new Subscription();
  scrollTypes = ScrollType;
  ixTreeHeaderWidth: number | null = null;
  isHaEnabled: boolean;

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

  readonly hasNestedChild = (_: number, dataset: DatasetDetails): boolean => Boolean(dataset.children?.length);
  private readonly scrollSubject = new Subject<number>();

  // Hidden on HA systems.
  // Issues: fenced reservations and the potential to cause a kernel panic, as well as an alert being raised.
  get showImportData(): boolean {
    return this.isHaEnabled !== undefined && !this.isHaEnabled;
  }

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
    private systemService: SystemGeneralService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart), untilDestroyed(this))
      .subscribe(() => {
        this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
        if (this.router.getCurrentNavigation()?.extras?.state?.hideMobileDetails) {
          this.closeMobileDetails();
        }
      });
  }

  ngOnInit(): void {
    this.datasetStore.loadDatasets();
    this.loadHaEnabled();
    this.setupTree();
    this.listenForRouteChanges();
    this.loadSystemDatasetConfig();
    this.listenForLoading();
    this.listenForDatasetScrolling();
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.layoutService.pageHeaderUpdater$.next(null);
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

  handleError = (error: WebsocketError | Job): void => {
    this.dialogService.errorReportMiddleware(error);
  };

  isSystemDataset(dataset: DatasetDetails): boolean {
    return isRootDataset(dataset) && this.systemDataset === dataset.name;
  }

  updateScroll(type: ScrollType): void {
    this.scrollSubject.next(
      type === ScrollType.IxTree ? this.ixTree.nativeElement.scrollLeft : this.ixTreeHeader.nativeElement.scrollLeft,
    );
  }

  onIxTreeWidthChange(event: ResizedEvent): void {
    this.ixTreeHeaderWidth = Math.round(event.newRect.width);
  }

  onSearch(query: string): void {
    this.dataSource.filter(query);
  }

  closeMobileDetails(): void {
    this.showMobileDetails = false;
  }

  createPool(): void {
    this.router.navigate(['/storage', 'create']);
  }

  viewDetails(dataset: DatasetDetails): void {
    this.router.navigate(['/datasets', dataset.id]);

    if (this.isMobileView) {
      this.showMobileDetails = true;

      // focus on details container
      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }

  loadHaEnabled(): void {
    if (this.systemService.isEnterprise) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
        if (isHaLicensed) {
          this.store$.select(selectHaStatus).pipe(filter(Boolean), untilDestroyed(this)).subscribe((haStatus) => {
            this.isHaEnabled = haStatus.hasHa;
            this.cdr.detectChanges();
          });
        } else {
          this.isHaEnabled = false;
        }
      });
    } else {
      this.isHaEnabled = false;
    }
  }

  onImportData(): void {
    this.slideIn.open(ImportDataComponent);
  }

  private setupTree(): void {
    this.datasetStore.datasets$.pipe(untilDestroyed(this)).subscribe({
      next: (datasets) => {
        this.createDataSource(datasets);
        this.treeControl.dataNodes = datasets;
        this.cdr.markForCheck();

        if (!datasets.length) {
          return;
        }

        const routeDatasetId = this.activatedRoute.snapshot.paramMap.get('datasetId');
        if (routeDatasetId) {
          this.datasetStore.selectDatasetById(routeDatasetId);
        } else {
          const firstNode = this.treeControl.dataNodes[0];
          this.router.navigate(['/datasets', firstNode.id]);
        }
      },
      error: this.handleError,
    });

    this.datasetStore.selectedBranch$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe({
        next: (selectedBranch: DatasetDetails[]) => {
          selectedBranch.forEach((dataset) => this.treeControl.expand(dataset));
        },
        error: this.handleError,
      });
  }

  private createDataSource(datasets: DatasetDetails[]): void {
    this.dataSource = new IxNestedTreeDataSource();
    this.dataSource.filterPredicate = (datasetsToFilter, query = '') => {
      return flattenTreeWithFilter(datasetsToFilter, (dataset: DatasetDetails) => {
        return dataset.name.toLowerCase().includes(query.toLowerCase());
      });
    };
    this.dataSource.sortComparer = datasetNameSortComparer;
    this.dataSource.data = datasets;
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

  private listenForDatasetScrolling(): void {
    this.subscription.add(
      this.scrollSubject
        .pipe(debounceTime(0), distinctUntilChanged(), untilDestroyed(this))
        .subscribe({
          next: (scrollLeft: number) => {
            this.ixTreeHeader.nativeElement.scrollLeft = scrollLeft;
            this.ixTree.nativeElement.scrollLeft = scrollLeft;
          },
        }),
    );
  }
}
