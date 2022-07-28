import { Component, Input } from '@angular/core';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-data-protection-card',
  templateUrl: './data-protection-card.component.html',
  styleUrls: ['./data-protection-card.component.scss'],
})
export class DataProtectionCardComponent {
  readonly console = console;
  @Input() dataset: DatasetInTree;

  constructor(
    private slideIn: IxSlideInService,
  ) {}

  addSnapshot(): void {
    const addForm = this.slideIn.open(SnapshotAddFormComponent);
    addForm.setDataset(this.dataset.id);
  }
}
