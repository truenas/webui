import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { isEncryptionRoot } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-encryption-cell',
  templateUrl: './dataset-encryption-cell.component.html',
  styleUrls: ['./dataset-encryption-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetEncryptionCellComponent {
  @Input() dataset: DatasetDetails;

  get isEncryptionRoot(): boolean {
    return isEncryptionRoot(this.dataset);
  }
}
