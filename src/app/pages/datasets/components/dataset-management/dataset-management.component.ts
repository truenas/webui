import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, pluck } from 'rxjs/operators';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { WebSocketService } from 'app/services';

const headerHeight = 48;
const footerHeight = 45;

@UntilDestroy()
@Component({
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetsManagementComponent implements OnInit {
  isLoading$ = this.datasetStore.isLoading$;
  selectedDataset$ = this.datasetStore.selectedDataset$;
  selectedParentDataset$ = this.datasetStore.selectedParentDataset$;

  dataSource: IxNestedTreeDataSource<DatasetInTree>;
  treeControl = new NestedTreeControl<DatasetInTree, string>((dataset) => dataset.children, {
    trackBy: (dataset) => dataset.id,
  });
  readonly hasNestedChild = (_: number, dataset: DatasetInTree): boolean => Boolean(dataset.children?.length);
  hasConsoleFooter = false;
  headerHeight = headerHeight;
  footerHeight = footerHeight;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private datasetStore: DatasetTreeStore,
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
  }

  onSearch(query: string): void {
    this.dataSource.filter(query);
  }

  private setupTree(): void {
    this.datasetStore.datasets$
      .pipe(untilDestroyed(this))
      .subscribe(
        (datasets) => {
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
            this.datasetStore.selectDatasetById(firstNode.id);
          }
        },
      );

    this.datasetStore.selectedBranch$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((selectedBranch: DatasetInTree[]) => {
        selectedBranch.forEach((dataset) => this.treeControl.expand(dataset));
      });
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params.pipe(
      pluck('datasetId'),
      untilDestroyed(this),
    ).subscribe((datasetId) => {
      if (datasetId) {
        this.datasetStore.selectDatasetById(datasetId);
      }
    });
  }

  private createDataSource(datasets: DatasetInTree[]): void {
    this.dataSource = new IxNestedTreeDataSource<DatasetInTree>(datasets);
    this.dataSource.filterPredicate = (datasets, query = '') => {
      return flattenTreeWithFilter(datasets, (dataset: DatasetInTree) => {
        return dataset.id.toLowerCase().includes(query.toLowerCase());
      });
    };
  }
}
