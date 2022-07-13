import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
import { isEncryptionRoot } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-encryption-cell',
  templateUrl: './dataset-encryption-cell.component.html',
  styleUrls: ['./dataset-encryption-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetEncryptionCellComponent {
  @Input() dataset: DatasetInTree;

  get isEncryptionRoot(): boolean {
    return isEncryptionRoot(this.dataset);
  }
}
