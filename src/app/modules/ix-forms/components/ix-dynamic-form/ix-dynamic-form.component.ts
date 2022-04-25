import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AddListItemEmitter, DeleteListItemEmitter, DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-form',
  styleUrls: ['./ix-dynamic-form.component.scss'],
  templateUrl: './ix-dynamic-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class IxDynamicFormComponent {
  @Input() dynamicForm: FormGroup;
  @Input() dynamicSection: DynamicFormSchema[];

  @Output() addListItem = new EventEmitter<AddListItemEmitter>();
  @Output() deleteListItem = new EventEmitter<DeleteListItemEmitter>();

  addControlNext(event: AddListItemEmitter): void {
    this.addListItem.emit(event);
  }

  removeControlNext(event: DeleteListItemEmitter): void {
    this.deleteListItem.emit(event);
  }
}
