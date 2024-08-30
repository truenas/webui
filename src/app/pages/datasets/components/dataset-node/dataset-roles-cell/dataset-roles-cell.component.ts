import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import * as _ from 'lodash-es';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { doesDatasetHaveShares, ixAppsDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-roles-cell',
  templateUrl: './dataset-roles-cell.component.html',
  styleUrls: ['./dataset-roles-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetRolesCellComponent {
  readonly dataset = input.required<DatasetDetails>();
  readonly isSystemDataset = input.required<boolean>();

  readonly isApps = computed(() => this.dataset().name.endsWith(ixAppsDataset));
  readonly appNames = computed(() => _.uniq(this.dataset().apps.map((app) => app.name)).join(', '));
  readonly vmNames = computed(() => _.uniq(this.dataset().vms.map((vm) => vm.name)).join(', '));

  readonly hasShares = computed(() => doesDatasetHaveShares(this.dataset()));
}
