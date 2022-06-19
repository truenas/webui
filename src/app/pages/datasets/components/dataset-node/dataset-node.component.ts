import {
  Component, ChangeDetectionStrategy, Input,
} from '@angular/core';
import { DatasetNode } from 'app/pages/datasets/components/dataset-node/dataset-node.interface';

@Component({
  selector: 'ix-dataset-node',
  templateUrl: './dataset-node.component.html',
  styleUrls: ['./dataset-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetNodeComponent {
  @Input() node: DatasetNode;
}
