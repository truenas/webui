import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map, pluck } from 'rxjs/operators';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { footerHeight, headerHeight } from 'app/modules/common/layouts/admin-layout/admin-layout.component.const';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';
import { WebSocketService } from 'app/services';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { TranslateService } from '@ngx-translate/core';

@UntilDestroy()
@Component({
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetsManagementComponent implements OnInit {
  isLoading$ = this.datasetStore.isLoading$;
  selectedDataset$ = this.datasetStore.selectedDataset$;
  dataSource: IxNestedTreeDataSource<DatasetDetails>;
  treeControl = new NestedTreeControl<DatasetDetails, string>((dataset) => dataset.children, {
    trackBy: (dataset) => dataset.id,
  });
  readonly hasNestedChild = (_: number, dataset: DatasetDetails): boolean => Boolean(dataset.children?.length);
  hasConsoleFooter = false;
  headerHeight = headerHeight;
  footerHeight = footerHeight;
  systemDataset: string;
  entityEmptyConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No Datasets'),
    message: `${this.translate.instant(
      'It seems you haven\'t configured pools yet.'
    )} ${this.translate.instant(
      'Please click the button below to create a pool.'
    )}`,
    button: {
      label: this.translate.instant('Create pool'),
      action: () => this.createPool(),
    },
  };

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private datasetStore: DatasetTreeStore,
    private router: Router,
    protected translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.datasetStore.loadDatasets();
    this.listenForRouteChanges();
    this.setupTree();

    this.ws
      .call('system.advanced.config')
      .pipe(untilDestroyed(this))
      .subscribe((advancedConfig) => {
        this.hasConsoleFooter = advancedConfig.consolemsg;
      });

    this.ws.call('systemdataset.config').pipe(
      map((config) => config.pool),
      untilDestroyed(this),
    ).subscribe((systemDataset) => {
      this.systemDataset = systemDataset;
    });
  }

  isSystemDataset(dataset: DatasetDetails): boolean {
    return isRootDataset(dataset) && this.systemDataset === dataset.name;
  }

  onSearch(query: string): void {
    this.dataSource.filter(query);
  }

  private setupTree(): void {
    this.datasetStore.datasets$
      .pipe(untilDestroyed(this))
      .subscribe(
        (datasets) => {
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
      );

    this.datasetStore.selectedBranch$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((selectedBranch: DatasetDetails[]) => {
        selectedBranch.forEach((dataset) => this.treeControl.expand(dataset));
      });
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params.pipe(
      pluck('datasetId'),
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
    this.router.navigate(['/storage2/create']);
  }
}
