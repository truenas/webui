import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { Dataset } from 'app/interfaces/dataset.interface';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-details-panel',
  templateUrl: './dataset-details-panel.component.html',
  styleUrls: ['./dataset-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsPanelComponent {
  @Input() dataset: Dataset;
  @Input() parentDataset: Dataset | undefined;

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
