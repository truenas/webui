import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TnIconComponent, tnIconMarker } from '@truenas/ui-components';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-icon',
  templateUrl: './dataset-icon.component.html',
  styleUrls: ['./dataset-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
  ],
})
export class DatasetIconComponent {
  readonly dataset = input.required<DatasetDetails>();

  protected readonly isRoot = computed(() => isRootDataset(this.dataset()));

  protected readonly isZvol = computed(() => this.dataset().type === DatasetType.Volume);

  protected readonly iconName = computed(() => {
    if (this.isRoot()) {
      return tnIconMarker('dataset-root', 'custom');
    }
    if (this.isZvol()) {
      return tnIconMarker('database', 'mdi');
    }

    return tnIconMarker('dataset', 'custom');
  });
}
