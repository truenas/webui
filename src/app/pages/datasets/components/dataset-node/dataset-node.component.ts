import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { datasetToken, isSystemDatasetToken } from 'app/pages/datasets/components/dataset-node/dataset-node.token';
import { getDatasetLabel } from 'app/pages/datasets/utils/dataset.utils';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-node',
  templateUrl: './dataset-node.component.html',
  styleUrls: ['./dataset-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetNodeComponent {
  constructor(
    @Inject(datasetToken) public dataset: DatasetDetails,
    @Inject(isSystemDatasetToken) public isSystemDataset: boolean,
  ) {}

  get label(): string {
    return getDatasetLabel(this.dataset);
  }
}
