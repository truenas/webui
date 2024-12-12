import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  BulkListItem,
  BulkListItemState,
} from 'app/modules/lists/bulk-list-item/bulk-list-item.interface';

@Component({
  selector: 'ix-bulk-list-item',
  templateUrl: './bulk-list-item.component.html',
  styleUrls: ['./bulk-list-item.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    TranslateModule,
    MatTooltip,
    MatProgressSpinner,
  ],
})
export class BulkListItemComponent<T> {
  readonly item = input.required<BulkListItem<T>>();

  readonly State = BulkListItemState;
}
