import {
  ChangeDetectionStrategy,
  Component, Input, input, output,
} from '@angular/core';

@Component({
  selector: 'ix-list-item',
  templateUrl: './ix-list-item.component.html',
  styleUrls: ['./ix-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxListItemComponent {
  readonly canDelete = input(true);
  @Input() label?: string;

  readonly delete = output();

  deleteItem(): void {
    this.delete.emit();
  }
}
