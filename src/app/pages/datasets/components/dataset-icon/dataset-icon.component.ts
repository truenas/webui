import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-icon',
  templateUrl: './dataset-icon.component.html',
  styleUrls: ['./dataset-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
  ],
})
export class DatasetIconComponent {
  readonly dataset = input.required<DatasetDetails>();

  protected readonly isRoot = computed(() => isRootDataset(this.dataset()));

  protected readonly isZvol = computed(() => this.dataset().type === DatasetType.Volume);

  protected readonly iconName = computed(() => {
    if (this.isRoot()) {
      return 'ix-dataset-root';
    }
    if (this.isZvol()) {
      return 'mdi-database';
    }

    return 'ix-dataset';
  });
}
