import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxTreeNode } from 'app/modules/ix-tree/interfaces/ix-tree-node.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-tree-nested-datasource';
import { AppLoaderService, WebSocketService } from 'app/services';
import { DatasetNode } from './dataset-node.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-management',
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetsManagementComponent implements OnInit {
  selectedDataset: Dataset; // Dataset to be passed as input for card components
  dataSource: IxNestedTreeDataSource<DatasetNode>;
  treeControl = new NestedTreeControl<IxTreeNode<Dataset>>((node) => node.children);
  readonly trackByFn: TrackByFunction<IxTreeNode<Dataset>> = (_, node) => node.label;
  readonly hasNestedChild = (_: number, nodeData: DatasetNode): boolean => !!nodeData.children?.length;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private loader: AppLoaderService, // TODO: Replace with a better approach
  ) { }

  ngOnInit(): void {
    this.loader.open();
    this.ws.call('pool.dataset.query', [[], {
      extra: {
        flat: false,
        properties: [
          'name',
          'type',
          'used',
          'available',
          'mountpoint',
          'encrypted',
        ],
      },
      order_by: ['name'],
    }]).pipe(
      untilDestroyed(this),
    ).subscribe(
      (datasets: Dataset[]) => {
        this.createDataSource(datasets);
        this.loader.close();
        console.info('datasets', datasets);
        console.info(this.treeControl);
        if (this.treeControl?.dataNodes.length > 0) {
          const node = this.treeControl.dataNodes[0];
          this.treeControl.expand(node);
          this.onDatasetSelected(node.item);
        }
        this.cdr.markForCheck();
      },
      (err) => {
        console.error(err);
        this.loader.close();
      },
    );
  }

  getDatasetNode(dataset: Dataset): DatasetNode {
    const nameSegments = dataset.name.split('/');

    return {
      label: nameSegments[nameSegments.length - 1],
      children: dataset.children?.length ? dataset.children.map((child) => this.getDatasetNode(child)) : [],
      item: dataset,
      roles: ['Dataset', `L${nameSegments.length}`],
      icon: this.getDatasetIcon(dataset),
    };
  }

  getDatasetIcon(dataset: Dataset): string {
    const level = dataset.name.split('/').length;
    if (level === 1) {
      return 'device_hub';
    } if (level > 1 && dataset.children.length) {
      return 'folder';
    }
    return 'mdi-database';
  }

  getDatasetTree(datasets: Dataset[]): DatasetNode[] {
    return datasets.map((dataset) => this.getDatasetNode(dataset));
  }

  createDataSource(datasets: Dataset[]): void {
    const dataNodes = this.getDatasetTree(datasets);
    this.dataSource = new IxNestedTreeDataSource<DatasetNode>(dataNodes);
    this.treeControl.dataNodes = dataNodes;
  }

  onSearch(query: string): void {
    console.info('search', query);
    // this.dataSource.filter = query;
  }

  onDatasetSelected(dataset: Dataset): void {
    this.selectedDataset = dataset;
  }
}
