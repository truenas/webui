import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Dataset } from 'app/interfaces/dataset.interface';
import { WebSocketService } from 'app/services';

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
  ) { }

  ngOnInit(): void {
    this.ws.call('pool.dataset.query').pipe(untilDestroyed(this)).subscribe(
      (datasets: Dataset[]) => {
        this.dataSource = new MatTableDataSource(datasets);
        if (datasets.length && datasets.length > 0) {
          this.selectedDataset = datasets[0];
        }
        this.cdr.markForCheck();
      },
    );
  }
}
