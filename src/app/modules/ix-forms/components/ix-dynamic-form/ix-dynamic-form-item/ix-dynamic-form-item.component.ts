import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output,
} from '@angular/core';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { AddListItemEvent, DeleteListItemEvent, DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';
import { CustomUntypedFormField } from 'app/modules/ix-forms/components/ix-dynamic-form/classes/custom-untyped-form-field';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-form-item',
  styleUrls: ['./ix-dynamic-form-item.component.scss'],
  templateUrl: './ix-dynamic-form-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxDynamicFormItemComponent implements OnInit {
  @Input() dynamicForm: UntypedFormGroup;
  @Input() dynamicSchema: DynamicFormSchemaNode;

  @Output() addListItem = new EventEmitter<AddListItemEvent>();
  @Output() deleteListItem = new EventEmitter<DeleteListItemEvent>();

  readonly DynamicFormSchemaType = DynamicFormSchemaType;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const dependsOn = this.dynamicSchema?.dependsOn;

    dependsOn?.forEach((depend) => {
      this.dynamicForm?.valueChanges.pipe(
        map((changes) => {
          return changes[depend];
        }),
        filter((x) => x != null),
        distinctUntilChanged(),
        untilDestroyed(this),
      ).subscribe(() => {
        this.changeDetectorRef.markForCheck();
      });
    });
    if (
      this.dynamicSchema
      && this.dynamicSchema.editable !== undefined
      && !this.dynamicSchema.editable
    ) {
      this.dynamicForm?.get(this.dynamicSchema.controlName).disable();
    }

    if (this.dynamicSchema?.hidden) {
      (this.dynamicForm.controls[this.dynamicSchema.controlName] as CustomUntypedFormField).hidden$.next(true);
    }
  }

  get getFormArray(): UntypedFormArray {
    return this.dynamicForm.controls[this.dynamicSchema.controlName] as UntypedFormArray;
  }

  get isHidden$(): Subject<boolean> {
    return (this.dynamicForm.controls[this.dynamicSchema.controlName] as CustomUntypedFormField).hidden$;
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
