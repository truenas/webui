import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { Dataset } from 'app/interfaces/dataset.interface';

@Component({
  selector: 'ix-dataset-details-panel',
  templateUrl: './dataset-details-panel.component.html',
  styleUrls: ['./dataset-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsPanelComponent {
  @Input() dataset: Dataset;
  @Input() parentDataset: Dataset | undefined;
}
