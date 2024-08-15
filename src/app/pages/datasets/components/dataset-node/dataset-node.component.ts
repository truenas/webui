import {
  ChangeDetectionStrategy, Component, computed,
  input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { getDatasetLabel } from 'app/pages/datasets/utils/dataset.utils';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-node',
  templateUrl: './dataset-node.component.html',
  styleUrls: ['./dataset-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetNodeComponent {
  readonly dataset = input.required<DatasetDetails>();
  readonly isSystemDataset = input<boolean>();

  protected readonly label = computed(() => getDatasetLabel(this.dataset()));
}
