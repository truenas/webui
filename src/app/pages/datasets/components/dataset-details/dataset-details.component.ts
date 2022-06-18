import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Dataset } from 'app/interfaces/dataset.interface';

@Component({
  selector: 'ix-dataset-details',
  templateUrl: './dataset-details.component.html',
  styleUrls: ['./dataset-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsComponent {
  @Input() dataset: Dataset;
  @Input() parentDataset: Dataset | undefined;
}
