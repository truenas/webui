import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { isEncryptionRoot } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-encryption-cell',
  templateUrl: './dataset-encryption-cell.component.html',
  styleUrls: ['./dataset-encryption-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    IxIconComponent,
  ],
})
export class DatasetEncryptionCellComponent {
  readonly dataset = input.required<DatasetDetails>();

  readonly isEncryptionRoot = computed(() => isEncryptionRoot(this.dataset()));
}
