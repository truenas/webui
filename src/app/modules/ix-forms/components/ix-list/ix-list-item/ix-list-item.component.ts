import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';

@Component({
  selector: 'ix-list-item',
  templateUrl: './ix-list-item.component.html',
  styleUrls: ['./ix-list-item.component.scss'],
})
export class IxListItemComponent {
  @Input() canDelete = true;
  @Output() delete = new EventEmitter<void>();

  deleteItem(): void {
    this.delete.emit();
  }
}
