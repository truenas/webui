import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { AddListItemEvent, DeleteListItemEvent, DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-form-item',
  styleUrls: ['./ix-dynamic-form-item.component.scss'],
  templateUrl: './ix-dynamic-form-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxDynamicFormItemComponent {
  @Input() dynamicForm: FormGroup;
  @Input() dynamicSchema: DynamicFormSchemaNode;

  @Output() addListItem = new EventEmitter<AddListItemEvent>();
  @Output() deleteListItem = new EventEmitter<DeleteListItemEvent>();

  readonly DynamicFormSchemaType = DynamicFormSchemaType;

  get getFormGroup(): FormGroup {
    return this.dynamicForm.controls[this.dynamicSchema.controlName] as FormGroup;
  }

  get getFormArray(): FormArray {
    return this.dynamicForm.controls[this.dynamicSchema.controlName] as FormArray;
  }

  get isHide(): boolean {
    return this.dynamicForm.controls[this.dynamicSchema.controlName].disabled;
  }

  addControl(): void {
    if (this.dynamicSchema.type === DynamicFormSchemaType.List) {
      this.addListItem.emit({
        array: this.getFormArray,
        schema: this.dynamicSchema.itemsSchema,
      });
    }
  }

  removeControl(index: number): void {
    this.deleteListItem.emit({
      array: this.getFormArray,
      index,
    });
  }

  addControlNext(event: AddListItemEvent): void {
    this.addListItem.emit(event);
  }

  removeControlNext(event: DeleteListItemEvent): void {
    this.deleteListItem.emit(event);
  }
}
