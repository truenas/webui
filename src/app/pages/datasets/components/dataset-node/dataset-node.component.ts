import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-node',
  templateUrl: './dataset-node.component.html',
  styleUrls: ['./dataset-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetNodeComponent {
  @Input() dataset: DatasetInTree;

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
