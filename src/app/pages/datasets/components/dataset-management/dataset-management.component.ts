import {
  Breakpoints,
  BreakpointState,
  BreakpointObserver,
} from '@angular/cdk/layout';
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
  TrackByFunction,
} from '@angular/core';
import {
  ActivatedRoute, NavigationStart, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ResizedEvent } from 'angular-resize-event';
import { uniqBy } from 'lodash';
import { Subject, Subscription } from 'rxjs';
import {
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
import { TreeDataSource } from 'app/modules/ix-tree/tree-datasource';
import { TreeFlattener } from 'app/modules/ix-tree/tree-flattener';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { datasetNameSortComparer } from 'app/pages/datasets/utils/dataset.utils';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsSystemHaCapable } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetsManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('ixTreeHeader', { static: false }) ixTreeHeader: ElementRef<HTMLElement>;
  @ViewChild('ixTree', { static: false }) ixTree: ElementRef<HTMLElement>;

  isSystemHaCapable$ = this.store$.select(selectIsSystemHaCapable);

  isLoading$ = this.datasetStore.isLoading$;
  selectedDataset$ = this.datasetStore.selectedDataset$;
  showMobileDetails = false;
  isMobileView = false;
  systemDataset: string;
  isLoading = true;
  subscription = new Subscription();
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

  // Flat API
  getLevel = (dataset: DatasetDetails): number => dataset?.name?.split('/')?.length - 1;
  isExpandable = (dataset: DatasetDetails): boolean => dataset?.children?.length > 0;
  treeControl = new FlatTreeControl<DatasetDetails>(
    this.getLevel,
    this.isExpandable,
  );
  treeFlattener = new TreeFlattener<DatasetDetails, DatasetDetails>(
    (dataset) => dataset,
    this.getLevel,
    this.isExpandable,
    () => ([]),
  );
  dataSource = new TreeDataSource(this.treeControl, this.treeFlattener);
  trackById: TrackByFunction<DatasetDetails> = (index: number, dataset: DatasetDetails): string => dataset?.id;
  readonly hasChild = (_: number, dataset: DatasetDetails): boolean => dataset?.children?.length > 0;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private datasetStore: DatasetTreeStore,
    private router: Router,
    protected translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private breakpointObserver: BreakpointObserver,
    private store$: Store<AppState>,
    @Inject(WINDOW) private window: Window,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart), untilDestroyed(this))
      .subscribe(() => {
        if (this.router.getCurrentNavigation()?.extras?.state?.hideMobileDetails) {
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
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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
    this.dialogService.error(this.errorHandler.parseError(error));
  };

  isSystemDataset(dataset: DatasetDetails): boolean {
    return dataset.name.split('/').length === 1 && this.systemDataset === dataset.name;
  }

  treeHeaderScrolled(): void {
    this.scrollSubject.next(this.ixTreeHeader.nativeElement.scrollLeft);
  }

  datasetTreeScrolled(scrollLeft: number): void {
    this.scrollSubject.next(scrollLeft);
  }

  datasetTreeWidthChanged(event: ResizedEvent): void {
    this.treeWidthChange$.next(event);
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

  private setupTree(): void {
    this.datasetStore.datasets$.pipe(untilDestroyed(this)).subscribe({
      next: (datasets) => {
        this.createDataSource(datasets);
        this.expandDatasetBranch();
        this.cdr.markForCheck();
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
    this.dataSource = new TreeDataSource(this.treeControl, this.treeFlattener, datasets);
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
        map((params) => params.datasetId as string),
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe((datasetId) => {
        this.datasetStore.selectDatasetById(datasetId);
      });
  }

  private listenForDatasetScrolling(): void {
    this.subscription.add(
      this.scrollSubject
        .pipe(distinctUntilChanged(), untilDestroyed(this))
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
        .pipe(distinctUntilChanged(), untilDestroyed(this))
        .subscribe({
          next: (event: ResizedEvent) => {
            this.ixTreeHeaderWidth = Math.round(event.newRect.width);
          },
        }),
    );
  }
}
