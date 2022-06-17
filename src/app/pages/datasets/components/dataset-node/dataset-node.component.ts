import {
  Component, ChangeDetectionStrategy, Input,
} from '@angular/core';
import { Dataset } from 'app/interfaces/dataset.interface';

@Component({
  selector: 'ix-dataset-node',
  templateUrl: './dataset-node.component.html',
  styleUrls: ['./dataset-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetNodeComponent {
  @Input() dataset: Dataset;

  get nameSegments(): string[] {
    return this.dataset.name.split('/');
  }

  get label(): string {
    return this.nameSegments[this.nameSegments.length - 1];
  }

  get icon(): string {
    const level = this.nameSegments.length;
    if (level === 1) {
      return 'device_hub';
    } if (level > 1 && this.dataset.children.length) {
      return 'folder';
    }
    return 'mdi-database';
  }

  get roles(): string[] {
    if (this.nameSegments.length === 1) {
      return ['Root Dataset'];
    }
    return ['Dataset', `L${this.nameSegments.length}`];
  }
}
