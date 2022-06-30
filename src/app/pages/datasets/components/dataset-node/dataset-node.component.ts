import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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

  get level(): number {
    return this.nameSegments.length;
  }

  get isRoot(): boolean {
    return this.level === 1;
  }

  get roles(): string[] {
    if (this.isRoot) {
      return ['Root Dataset'];
    }
    return [];
  }
}
