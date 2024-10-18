import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, output,
} from '@angular/core';
import { UntypedFormArray, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { ChartSchemaNode } from 'app/interfaces/app.interface';
import {
  AddListItemEvent, DeleteListItemEvent, DynamicFormSchemaList, DynamicFormSchemaNode,
} from 'app/interfaces/dynamic-form-schema.interface';
import { Option } from 'app/interfaces/option.interface';
import { CustomUntypedFormField } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-form-item',
  styleUrls: ['./ix-dynamic-form-item.component.scss'],
  templateUrl: './ix-dynamic-form-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SchedulerComponent,
    TooltipComponent,
    IxCodeEditorComponent,
    IxListComponent,
    IxListItemComponent,
    IxErrorsComponent,
    IxInputComponent,
    IxSelectComponent,
    IxComboboxComponent,
    IxExplorerComponent,
    IxCheckboxComponent,
    IxIpInputWithNetmaskComponent,
    TranslateModule,
    CastPipe,
    AsyncPipe,
  ],
})
export class IxDynamicFormItemComponent implements OnInit {
  @Input() dynamicForm: UntypedFormGroup;
  @Input() dynamicSchema: DynamicFormSchemaNode;
  @Input() isEditMode: boolean;

  readonly addListItem = output<AddListItemEvent>();
  readonly deleteListItem = output<DeleteListItemEvent>();

  readonly DynamicFormSchemaType = DynamicFormSchemaType;

  get isAllListControlsDisabled(): boolean {
    return (this.dynamicSchema as DynamicFormSchemaList).items.every((item) => {
      return item.editable !== undefined && item.editable !== null && !item.editable;
    });
  }

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const dependsOn = this.dynamicSchema?.dependsOn;

    dependsOn?.forEach((depend) => {
      this.dynamicForm?.valueChanges.pipe(
        map((changes: Record<string, unknown>) => {
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
      this.dynamicSchema?.editable !== undefined
      && !this.dynamicSchema?.editable
    ) {
      this.dynamicForm?.get(this.dynamicSchema.controlName)?.disable();
    }

    if (this.dynamicSchema?.hidden) {
      (this.dynamicForm.controls[this.dynamicSchema.controlName] as CustomUntypedFormField)?.hidden$?.next(true);
    }
  }

  get getFormArray(): UntypedFormArray {
    return this.dynamicForm.controls[this.dynamicSchema.controlName] as UntypedFormArray;
  }

  get isHidden$(): Subject<boolean> {
    return (this.dynamicForm.controls[this.dynamicSchema.controlName] as CustomUntypedFormField)?.hidden$;
  }

  addControl(schema?: ChartSchemaNode[]): void {
    if (this.dynamicSchema.type === DynamicFormSchemaType.List) {
      this.addListItem.emit({
        array: this.getFormArray,
        schema: schema || this.dynamicSchema.itemsSchema,
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

  getEnumTypeProvider(options$: Observable<Option[]>): SimpleAsyncComboboxProvider {
    return new SimpleAsyncComboboxProvider(options$);
  }
}
