import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-icon',
  templateUrl: './dataset-icon.component.html',
  styleUrls: ['./dataset-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetIconComponent {
  @Input() dataset: DatasetInTree;

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }

  get isZvol(): boolean {
    return this.dataset.type === DatasetType.Volume;
  }
}
