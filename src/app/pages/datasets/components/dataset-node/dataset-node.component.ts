import {
  ChangeDetectionStrategy, Component, computed,
  input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';
import { DatasetEncryptionCellComponent } from 'app/pages/datasets/components/dataset-node/dataset-encryption-cell/dataset-encryption-cell.component';
import { DatasetRolesCellComponent } from 'app/pages/datasets/components/dataset-node/dataset-roles-cell/dataset-roles-cell.component';
import { getDatasetLabel } from 'app/pages/datasets/utils/dataset.utils';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-node',
  templateUrl: './dataset-node.component.html',
  styleUrls: ['./dataset-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    DatasetIconComponent,
    MatTooltip,
    FileSizePipe,
    DatasetEncryptionCellComponent,
    DatasetRolesCellComponent,
  ],
})
export class DatasetNodeComponent {
  readonly dataset = input.required<DatasetDetails>();
  readonly isSystemDataset = input<boolean>();

  protected readonly label = computed(() => getDatasetLabel(this.dataset()));
}
