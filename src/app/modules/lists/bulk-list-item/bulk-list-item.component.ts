import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import {
  BulkListItem,
  BulkListItemState,
} from 'app/modules/lists/bulk-list-item/bulk-list-item.interface';

@Component({
  selector: 'ix-bulk-list-item',
  templateUrl: './bulk-list-item.component.html',
  styleUrls: ['./bulk-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TnTooltipDirective,
    TranslateModule,
    MatProgressSpinner,
  ],
})
export class BulkListItemComponent<T> {
  readonly item = input.required<BulkListItem<T>>();

  readonly State = BulkListItemState;
}
