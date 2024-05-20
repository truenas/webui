import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  BulkListItem,
  BulkListItemState,
} from 'app/core/components/bulk-list-item/bulk-list-item.interface';

@Component({
  selector: 'ix-bulk-list-item',
  templateUrl: './bulk-list-item.component.html',
  styleUrls: ['./bulk-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkListItemComponent<T> {
  readonly item = input.required<BulkListItem<T>>();

  readonly State = BulkListItemState;
}
