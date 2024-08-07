import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import _ from 'lodash';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { doesDatasetHaveShares, isRootDataset, ixAppsDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-roles-cell',
  templateUrl: './dataset-roles-cell.component.html',
  styleUrls: ['./dataset-roles-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetRolesCellComponent {
  readonly dataset = input.required<DatasetDetails>();
  readonly isSystemDataset = input.required<boolean>();

  readonly isRoot = computed(() => isRootDataset(this.dataset()));

  readonly isApps = computed(() => this.dataset().name.endsWith(ixAppsDataset));
  readonly appNames = computed(() => _.uniq(this.dataset().apps.map((app) => app.name)).join(', '));
  readonly vmNames = computed(() => _.uniq(this.dataset().vms.map((vm) => vm.name)).join(', '));

  readonly hasShares = computed(() => doesDatasetHaveShares(this.dataset()));
}
