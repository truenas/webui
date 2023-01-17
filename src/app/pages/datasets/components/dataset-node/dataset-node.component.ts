import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { getDatasetLabel } from 'app/pages/datasets/utils/dataset.utils';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-node',
  templateUrl: './dataset-node.component.html',
  styleUrls: ['./dataset-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetNodeComponent {
  @Input() dataset: DatasetDetails;
  @Input() isSystemDataset: boolean;

  get label(): string {
    return getDatasetLabel(this.dataset);
  }
}
