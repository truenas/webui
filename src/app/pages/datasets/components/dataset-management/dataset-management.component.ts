import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { pluck } from 'rxjs/operators';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { findInTree } from 'app/modules/ix-tree/utils/find-in-tree.utils';
import { DatasetStore } from 'app/pages/datasets/store/dataset-store.service';
import { getDatasetAndParentsById } from 'app/pages/datasets/utils/get-datasets-in-tree-by-id.utils';
import { AppLoaderService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-management',
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetsManagementComponent implements OnInit {
  selectedDataset: Dataset;
  selectedDatasetParent: Dataset | undefined;

  dataSource: IxNestedTreeDataSource<Dataset>;
  treeControl = new NestedTreeControl<Dataset, string>((dataset) => dataset.children, {
    trackBy: (dataset) => dataset.id,
  });
  readonly trackByFn: TrackByFunction<Dataset> = (_, dataset) => dataset.id;
  readonly hasNestedChild = (_: number, dataset: Dataset): boolean => Boolean(dataset.children?.length);
  readonly isDatasetGroup = (_: number, dataset: Dataset): boolean => dataset.id.startsWith('group');

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private loader: AppLoaderService, // TODO: Replace with a better approach
    private datasetStore: DatasetStore,
  ) { }

  ngOnInit(): void {
    this.loadTree();

    this.datasetStore.onReloadList
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadTree());
  }

  onSearch(query: string): void {
    this.dataSource.filter(query);
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
        const datasetGroups = this.createGroups(datasets);
        this.createDataSource(datasetGroups);
        this.treeControl.dataNodes = datasetGroups;
        this.loader.close();
        const routeDatasetId = this.activatedRoute.snapshot.paramMap.get('datasetId');
        if (routeDatasetId) {
          this.selectByDatasetId(routeDatasetId);
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

  private createGroups(datasets: Dataset[]): Dataset[] {
    return datasets.map((dataset) => ({
      id: `group-${dataset.id}`,
      name: dataset.name,
      children: [dataset],
    } as Dataset));
  }

  private selectByDatasetId(selectedDatasetId: string): void {
    if (!this.treeControl.dataNodes.length) {
      return;
    }

    const datasetGroup = this.treeControl.dataNodes[0];
    this.treeControl.expand(datasetGroup);

    if (!datasetGroup.children.length) {
      return;
    }

    const selectedBranch = getDatasetAndParentsById(datasetGroup.children, selectedDatasetId);
    if (!selectedBranch) {
      return;
    }

    this.selectedDataset = selectedBranch[selectedBranch.length - 1];
    this.selectedDatasetParent = selectedBranch[selectedBranch.length - 2];

    selectedBranch.forEach((dataset) => this.treeControl.expand(dataset));
  }

  private selectFirstNode(): void {
    if (!this.treeControl?.dataNodes.length) {
      return;
    }

    const datasetGroup = this.treeControl.dataNodes[0];
    this.treeControl.expand(datasetGroup);
    if (datasetGroup.children.length) {
      this.treeControl.expand(datasetGroup.children[0]);
      this.selectedDataset = datasetGroup.children[0];
      this.selectedDatasetParent = undefined;
    }
  }

  private listenForRouteChanges(): void {
    this.activatedRoute.params.pipe(
      pluck('datasetId'),
      untilDestroyed(this),
    ).subscribe(
      (datasetId) => this.selectByDatasetId(datasetId),
    );
  }

  private createDataSource(datasets: Dataset[]): void {
    this.dataSource = new IxNestedTreeDataSource<Dataset>(datasets);
    this.dataSource.filterPredicate = (datasets, query = '') => {
      return datasets.map((datasetRoot) => {
        return findInTree([datasetRoot], (dataset) => dataset.id.toLowerCase().includes(query.toLowerCase()));
      }).filter(Boolean);
    };
  }
}
