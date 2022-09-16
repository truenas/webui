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
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs/operators';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetsManagementComponent implements OnInit, AfterViewInit {
  isLoading$ = this.datasetStore.isLoading$;
  selectedDataset$ = this.datasetStore.selectedDataset$;
  dataSource: IxNestedTreeDataSource<DatasetDetails>;
  treeControl = new NestedTreeControl<DatasetDetails, string>((dataset) => dataset.children, {
    trackBy: (dataset) => dataset.id,
  });
  readonly hasNestedChild = (_: number, dataset: DatasetDetails): boolean => Boolean(dataset.children?.length);
  showMobileDetails = false;
  isMobileView = false;

  systemDataset: string;

  entityEmptyConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No Datasets'),
    message: `${this.translate.instant(
      'It seems you haven\'t configured pools yet.',
    )} ${this.translate.instant(
      'Please click the button below to create a pool.',
    )}`,
    button: {
      label: this.translate.instant('Create pool'),
      action: () => this.createPool(),
    },
  };

  isLoading = true;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private datasetStore: DatasetTreeStore,
    private router: Router,
    protected translate: TranslateService,
    private dialogService: DialogService,
    private breakpointObserver: BreakpointObserver,
  ) { }

  ngOnInit(): void {
    this.datasetStore.loadDatasets();
    this.listenForRouteChanges();
    this.setupTree();

    this.ws.call('systemdataset.config').pipe(
      map((config) => config.pool),
      untilDestroyed(this),
    ).subscribe({
      next: (systemDataset) => {
        this.systemDataset = systemDataset;
      },
      error: this.handleError,
    });

    this.isLoading$
      .pipe(untilDestroyed(this))
      .subscribe((isLoading) => {
        this.isLoading = isLoading;
        this.cdr.markForCheck();
      });
  }

  handleError = (error: WebsocketError | Job<null, unknown[]>): void => {
    this.dialogService.errorReportMiddleware(error);
  };

  isSystemDataset(dataset: DatasetDetails): boolean {
    return isRootDataset(dataset) && this.systemDataset === dataset.name;
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

  onSearch(query: string): void {
    this.dataSource.filter(query);
  }

  private setupTree(): void {
    this.datasetStore.datasets$
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (datasets) => {
          this.sortDatasetsByName(datasets);
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

  private listenForRouteChanges(): void {
    this.activatedRoute.params.pipe(
      map((params) => params.datasetId),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((datasetId: string) => {
      this.datasetStore.selectDatasetById(datasetId);
    });
  }

  private createDataSource(datasets: DatasetDetails[]): void {
    this.dataSource = new IxNestedTreeDataSource<DatasetDetails>(datasets);
    this.dataSource.filterPredicate = (datasets, query = '') => {
      return flattenTreeWithFilter(datasets, (dataset: DatasetDetails) => {
        return dataset.id.toLowerCase().includes(query.toLowerCase());
      });
    };
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

  createPool(): void {
    this.router.navigate(['/storage', 'create']);
  }

  // Expose hidden details on mobile
  openMobileDetails(): void {
    if (this.isMobileView) {
      this.showMobileDetails = true;
    }
  }

  closeMobileDetails(): void {
    this.showMobileDetails = false;
  }
}
