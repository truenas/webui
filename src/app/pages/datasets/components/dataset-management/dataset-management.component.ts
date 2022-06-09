import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Dataset } from 'app/interfaces/dataset.interface';
import { AppLoaderService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-management',
  templateUrl: './dataset-management.component.html',
  styleUrls: ['./dataset-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetsManagementComponent implements OnInit {
  displayedColumns: string[] = ['name', 'encryption'];
  dataSource: MatTableDataSource<Dataset> = new MatTableDataSource([]);

  selectedDataset: Dataset; // Dataset to be passed as input for card components
  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private loader: AppLoaderService, // TODO: Replace with a better approach
  ) { }

  ngOnInit(): void {
    this.loader.open();
    this.ws.call('pool.dataset.query', [[], {
      extra: {
        properties: [
          'type',
          'used',
          'available',
          'mountpoint',
        ],
      },
    }]).pipe(untilDestroyed(this)).subscribe(
      (datasets: Dataset[]) => {
        this.loader.close();
        this.dataSource = new MatTableDataSource(datasets);
        if (datasets.length && datasets.length > 0) {
          this.selectedDataset = datasets[0];
        }
        this.cdr.markForCheck();
      },
    );
  }

  onDatasetSelected(dataset: Dataset): void {
    this.selectedDataset = dataset;
  }
}
