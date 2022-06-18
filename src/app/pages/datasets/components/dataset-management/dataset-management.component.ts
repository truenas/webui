import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { pluck } from 'rxjs/operators';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxTreeNode } from 'app/modules/ix-tree/interfaces/ix-tree-node.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-tree-nested-datasource';
import { findInTree } from 'app/pages/datasets/utils/find-in-tree.utils';
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
  selectedNode: DatasetNode;
  dataSource: IxNestedTreeDataSource<DatasetNode>;
  treeControl = new NestedTreeControl<IxTreeNode<Dataset>>((node) => node.children);
  readonly trackByFn: TrackByFunction<IxTreeNode<Dataset>> = (_, node) => node.label;
  readonly hasNestedChild = (_: number, nodeData: DatasetNode): boolean => !!nodeData.children?.length;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private loader: AppLoaderService, // TODO: Replace with a better approach
  ) { }

  ngOnInit(): void {
    this.loadTree();
  }

  onSearch(query: string): void {
    console.info('onSearch', query);
  }

  private loadTree(): void {
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
          'encryption',
          'encryptionroot',
          'keyformat',
          'keystatus',
        ],
      },
      order_by: ['name'],
    }]).pipe(
      untilDestroyed(this),
    ).subscribe(
      (datasets: Dataset[]) => {
        this.createDataSource(datasets);
        this.loader.close();
        const routeDatasetId = this.activatedRoute.snapshot.paramMap.get('datasetId');
        if (routeDatasetId) {
          this.selectNodeById(routeDatasetId);
        } else {
          this.selectFirstNode();
        }

        this.listenForRouteChanges();
        this.cdr.markForCheck();
      },
      (err) => {
        console.error(err); // TODO: Handle error.
        this.loader.close();
      },
    );
  }

  private getDatasetNode(dataset: Dataset, parent?: DatasetNode): DatasetNode {
    const nameSegments = dataset.name.split('/');

    const node: DatasetNode = {
      parent,
      label: nameSegments[nameSegments.length - 1],
      children: [],
      item: dataset,
      roles: ['Dataset', `L${nameSegments.length}`],
      icon: this.getDatasetIcon(dataset),
    };
    node.children = dataset.children.map((child) => this.getDatasetNode(child, node));
    return node;
  }

  private getDatasetIcon(dataset: Dataset): string {
    const level = dataset.name.split('/').length;
    if (level === 1) {
      return 'device_hub';
    } if (level > 1 && dataset.children.length) {
      return 'folder';
    }
    return 'mdi-database';
  }

  private getDatasetTree(datasets: Dataset[]): DatasetNode[] {
    return datasets.map((dataset) => this.getDatasetNode(dataset));
  }

  private createDataSource(datasets: Dataset[]): void {
    const dataNodes = this.getDatasetTree(datasets);
    this.dataSource = new IxNestedTreeDataSource<DatasetNode>(dataNodes);
    this.treeControl.dataNodes = dataNodes;
  }

  private selectNodeById(datasetId: string): void {
    const node = findInTree(this.treeControl.dataNodes, (node) => node.item.id === datasetId) as DatasetNode;
    if (!node) {
      return;
    }

    this.selectedNode = node;
    this.treeControl.expand(node);

    let parent = node.parent;
    while (parent) {
      this.treeControl.expand(parent);
      parent = parent.parent;
    }
  }

  private selectFirstNode(): void {
    if (!this.treeControl?.dataNodes.length) {
      return;
    }

    const node = this.treeControl.dataNodes[0];
    this.treeControl.expand(node);
    this.selectedNode = node as DatasetNode;
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params.pipe(
      pluck('datasetId'),
      untilDestroyed(this),
    ).subscribe(
      (datasetId) => this.selectNodeById(datasetId),
    );
  }
}
