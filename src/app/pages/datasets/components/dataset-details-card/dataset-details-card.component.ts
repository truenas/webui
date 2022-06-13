import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Dataset } from 'app/interfaces/dataset.interface';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-details-card',
  templateUrl: './dataset-details-card.component.html',
  styleUrls: ['./dataset-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsCardComponent implements OnChanges {
  @Input() dataset: Dataset;
  loading = false;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.ws.call('pool.dataset.query', [[['id', '=', changes.dataset.currentValue.id]]]).pipe(untilDestroyed(this)).subscribe(
      (dataset) => {
        this.loading = false;
        this.dataset = dataset[0];
        this.cdr.markForCheck();
      },
    );
  }
}
