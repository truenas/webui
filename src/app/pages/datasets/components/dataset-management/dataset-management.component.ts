import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-tree-nested-datasource';
import { AppLoaderService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-management',
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetsManagementComponent implements OnInit {
  selectedDataset: Dataset; // Dataset to be passed as input for card components
  dataSource: IxNestedTreeDataSource<Dataset>;
  treeControl = new NestedTreeControl<Dataset, string>((dataset) => dataset.children, {
    trackBy: (dataset) => dataset.id,
  });
  readonly trackByFn: TrackByFunction<Dataset> = (_, node) => node.id;
  readonly hasNestedChild = (_: number, dataset: Dataset): boolean => Boolean(dataset.children?.length);

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
      },
      order_by: ['name'],
    }]).pipe(
      untilDestroyed(this),
    ).subscribe(
      (datasets: Dataset[]) => {
        this.dataSource = new IxNestedTreeDataSource<Dataset>(datasets);
        this.treeControl.dataNodes = datasets;
        this.loader.close();
        if (this.treeControl?.dataNodes.length > 0) {
          const dataset = this.treeControl.dataNodes[0];
          this.treeControl.expand(dataset);
          this.onDatasetSelected(dataset);
        }
        this.cdr.markForCheck();
      },
      (err) => {
        console.error(err);
        this.loader.close();
      },
    );
  }

  onSearch(query: string): void {
    console.info('onSearch', query);
  }

  onDatasetSelected(dataset: Dataset): void {
    this.selectedDataset = dataset;
  }
}
