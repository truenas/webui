import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AddListItemEmitter, DeleteListItemEmitter } from 'app/interfaces/dynamic-form-schema.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-form-item',
  styleUrls: ['./ix-dynamic-form-item.component.scss'],
  templateUrl: './ix-dynamic-form-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxDynamicFormItemComponent {
  @Input() dynamicForm: FormGroup;
  @Input() dynamicSchema: any;

  @Output() addListItem = new EventEmitter<AddListItemEmitter>();
  @Output() deleteListItem = new EventEmitter<DeleteListItemEmitter>();

  get getFormGroup(): FormGroup {
    return this.dynamicForm.controls[this.dynamicSchema.controlName] as FormGroup;
  }

  get getFormArray(): FormArray {
    return this.dynamicForm.controls[this.dynamicSchema.controlName] as FormArray;
  }

  get isHide(): boolean {
    return this.dynamicForm.controls[this.dynamicSchema.controlName].disabled;
  }

  getFormItem(element: any): FormGroup {
    return element as FormGroup;
  }

  addControl(): void {
    this.addListItem.emit({
      array: this.getFormArray,
      schema: this.dynamicSchema.items_schema,
    });
  }

  removeControl(index: number): void {
    this.deleteListItem.emit({
      array: this.getFormArray,
      index,
    });
  }

  addControlNext(event: AddListItemEmitter): void {
    this.addListItem.emit(event);
  }

  removeControlNext(event: DeleteListItemEmitter): void {
    this.deleteListItem.emit(event);
  }
}
