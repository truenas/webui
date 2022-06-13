import {
  Component, Input,
} from '@angular/core';
import { BulkListItem, BulkListItemState } from 'app/core/components/bulk-list-item/bulk-list-item.interface';

@Component({
  selector: 'ix-bulk-list-item',
  templateUrl: './bulk-list-item.component.html',
  styleUrls: ['./bulk-list-item.component.scss'],
})
export class BulkListItemComponent<T> {
  @Input() item: BulkListItem<T>;
  readonly State = BulkListItemState;
}
