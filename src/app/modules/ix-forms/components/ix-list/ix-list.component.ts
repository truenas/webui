import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';

@Component({
  selector: 'ix-list',
  templateUrl: './ix-list.component.html',
  styleUrls: ['./ix-list.component.scss'],
})
export class IxListComponent {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() empty: boolean;
  @Input() required: boolean;
  @Input() canAdd = true;

  @Output() add = new EventEmitter<void>();

  addItem(): void {
    this.add.emit();
  }

  isDisabled = false;

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
