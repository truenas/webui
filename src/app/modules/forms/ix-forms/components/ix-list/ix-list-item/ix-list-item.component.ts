import {
  ChangeDetectionStrategy,
  Component, EventEmitter, input, Output,
} from '@angular/core';

@Component({
  selector: 'ix-list-item',
  templateUrl: './ix-list-item.component.html',
  styleUrls: ['./ix-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxListItemComponent {
  readonly canDelete = input(true);
  @Output() delete = new EventEmitter<void>();

  deleteItem(): void {
    this.delete.emit();
  }
}
