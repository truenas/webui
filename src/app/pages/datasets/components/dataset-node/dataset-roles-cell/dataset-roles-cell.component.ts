import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { isDatasetHasShares, isEncryptionRoot, isRootDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-roles-cell',
  templateUrl: './dataset-roles-cell.component.html',
  styleUrls: ['./dataset-roles-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetRolesCellComponent {
  @Input() dataset: DatasetDetails;
  @Input() isSystemDataset: boolean;

  get isEncryptionRoot(): boolean {
    return isEncryptionRoot(this.dataset);
  }

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }

  get isApplications(): boolean {
    return this.dataset.name.endsWith('ix-applications');
  }

  get hasShares(): boolean {
    return isDatasetHasShares(this.dataset);
  }
}
