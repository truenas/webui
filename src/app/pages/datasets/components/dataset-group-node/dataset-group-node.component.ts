import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DatasetRoot } from 'app/interfaces/dataset-nested-data-node.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-group-node',
  templateUrl: './dataset-group-node.component.html',
  styleUrls: ['./dataset-group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetGroupNodeComponent {
  @Input() dataset: DatasetRoot;
}
