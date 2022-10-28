import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import _ from 'lodash';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { isDatasetHasShares, isRootDataset, ixApplications } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-roles-cell',
  templateUrl: './dataset-roles-cell.component.html',
  styleUrls: ['./dataset-roles-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetRolesCellComponent {
  @Input() dataset: DatasetDetails;
  @Input() isSystemDataset: boolean;

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }

  get isApplications(): boolean {
    return this.dataset.name.endsWith(ixApplications);
  }

  get appsNames(): string {
    return _.uniq(this.dataset.apps.map((app) => app.name)).join(', ');
  }

  get vmsNames(): string {
    return _.uniq(this.dataset.vms.map((app) => app.name)).join(', ');
  }

  get hasShares(): boolean {
    return isDatasetHasShares(this.dataset);
  }
}
