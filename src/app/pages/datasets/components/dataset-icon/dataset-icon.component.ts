import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-icon',
  templateUrl: './dataset-icon.component.html',
  styleUrls: ['./dataset-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetIconComponent {
  @Input() dataset: DatasetDetails;

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }

  get isZvol(): boolean {
    return this.dataset.type === DatasetType.Volume;
  }

  get name(): string {
    if (this.isZvol) {
      return 'mdi-database';
    }
    if (!this.isZvol) {
      return 'folder';
    }

    return undefined;
  }
}
