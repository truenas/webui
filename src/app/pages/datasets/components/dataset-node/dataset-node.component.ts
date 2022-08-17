import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DatasetDetails } from 'app/interfaces/dataset.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-node',
  templateUrl: './dataset-node.component.html',
  styleUrls: ['./dataset-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetNodeComponent {
  @Input() dataset: DatasetDetails;
  @Input() isSystemDataset: boolean;

  get nameSegments(): string[] {
    return this.dataset.name.split('/');
  }

  get label(): string {
    return this.nameSegments[this.nameSegments.length - 1];
  }
}
