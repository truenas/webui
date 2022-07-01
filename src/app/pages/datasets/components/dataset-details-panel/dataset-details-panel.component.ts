import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { isIocageMounted, isRootDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-details-panel',
  templateUrl: './dataset-details-panel.component.html',
  styleUrls: ['./dataset-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsPanelComponent {
  @Input() dataset: Dataset;
  @Input() parentDataset: Dataset | undefined;

  get hasPermissions(): boolean {
    return this.dataset.type === DatasetType.Filesystem && !isIocageMounted(this.dataset);
  }

  get parentPath(): string {
    const parentPath = this.dataset.name.split('/').slice(0, -1).join('/');
    return `/${parentPath}/`;
  }

  get ownName(): string {
    return this.dataset.name.split('/').slice(-1)[0];
  }

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }
}
