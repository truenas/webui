import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-icon',
  templateUrl: './dataset-icon.component.html',
  styleUrls: ['./dataset-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetIconComponent {
  @Input() dataset: Dataset;

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }

  get isZvol(): boolean {
    return this.dataset.type === DatasetType.Volume;
  }
}
