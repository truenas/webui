import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, pluck } from 'rxjs/operators';
import { DatasetNestedDataNode, isDatasetInTree } from 'app/interfaces/dataset-nested-data-node.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { flattenTreeWithFilter } from 'app/modules/ix-tree/utils/flattern-tree-with-filter';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { WebSocketService } from 'app/services';

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

  dataSource: IxNestedTreeDataSource<DatasetNestedDataNode>;
  treeControl = new NestedTreeControl<DatasetNestedDataNode, string>((dataset) => dataset.children, {
    trackBy: (dataset) => dataset.id,
  });
  readonly hasNestedChild = (_: number, dataset: DatasetNestedDataNode): boolean => Boolean(dataset.children?.length);
  readonly isDatasetRoot = (_: number, dataset: DatasetNestedDataNode): boolean => !isDatasetInTree(dataset);

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
  }

  onSearch(query: string): void {
    this.dataSource.filter(query);
  }

  private setupTree(): void {
    this.datasetStore.datasets$
      .pipe(untilDestroyed(this))
      .subscribe(
        (datasets) => {
          const dataNodes = this.createDataNodes(datasets);
          this.createDataSource(dataNodes);
          this.treeControl.dataNodes = dataNodes;
          this.selectGroupNodes();
          this.cdr.markForCheck();

          if (!dataNodes.length) {
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

  onRowGroupSelected(nodeSelected: DatasetNestedDataNode, _: MouseEvent): void {
    if (this.treeControl.isExpanded(nodeSelected)) {
      this.treeControl.collapse(nodeSelected);
    } else {
      this.treeControl.expand(nodeSelected);
    }
  }

  private selectGroupNodes(): void {
    this.treeControl?.dataNodes?.forEach((node) => this.treeControl.expand(node));
  }

  private createDataNodes(datasets: DatasetInTree[]): DatasetNestedDataNode[] {
    const dataNodes: DatasetNestedDataNode[] = [];
    datasets.forEach((dataset) => {
      dataNodes.push({
        children: [dataset],
        id: '_' + dataset.id,
        pool: dataset.pool,
        name: dataset.name,
      });
    });
    return dataNodes;
  }

  private createDataSource(datasets: DatasetNestedDataNode[]): void {
    this.dataSource = new IxNestedTreeDataSource<DatasetNestedDataNode>(datasets);
    this.dataSource.filterPredicate = (datasets, query = '') => {
      return flattenTreeWithFilter(datasets, (dataset: DatasetInTree) => {
        return dataset.id.toLowerCase().includes(query.toLowerCase());
      });
    };
  }
}
