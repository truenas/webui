import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, OnInit, output, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UntypedFormArray, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnAutocompleteComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormListComponent,
  TnFormListItemComponent, TnIconComponent, TnInputComponent, TnSelectComponent, TnTooltipDirective,
} from '@truenas/ui-components';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map, take } from 'rxjs/operators';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { ChartSchemaNode } from 'app/interfaces/app.interface';
import {
  AddListItemEvent,
  DeleteListItemEvent, DynamicFormSchemaDict, DynamicFormSchemaEnum, DynamicFormSchemaExplorer,
  DynamicFormSchemaInput,
  DynamicFormSchemaList,
  DynamicFormSchemaNode, DynamicFormSchemaSelect, DynamicFormSchemaText,
  DynamicFormSchemaUri,
} from 'app/interfaces/dynamic-form-schema.interface';
import { IxCodeEditorComponent } from 'app/modules/forms/controls/ix-code-editor/ix-code-editor.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { CustomUntypedFormField } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';

@Component({
  selector: 'ix-dynamic-form-item',
  styleUrls: ['./ix-dynamic-form-item.component.scss'],
  templateUrl: './ix-dynamic-form-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnFormListComponent,
    TnFormListItemComponent,
    ReactiveFormsModule,
    SchedulerComponent,
    TnTooltipDirective,
    TnIconComponent,
    IxCodeEditorComponent,
    IxErrorsComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TnAutocompleteComponent,
    IxExplorerComponent,
    IxIpInputWithNetmaskComponent,
    TranslateModule,
    CastPipe,
    AsyncPipe,
    ExplorerCreateDatasetComponent,
  ],
})
export class IxDynamicFormItemComponent implements OnInit, AfterViewInit {
  private changeDetectorRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly dynamicForm = input.required<UntypedFormGroup>();
  readonly dynamicSchema = input.required<DynamicFormSchemaNode>();
  readonly isEditMode = input<boolean>();

  readonly addListItem = output<AddListItemEvent>();
  readonly deleteListItem = output<DeleteListItemEvent>();

  readonly DynamicFormSchemaType = DynamicFormSchemaType;
  readonly CodeEditorLanguage = CodeEditorLanguage;

  get isAllListControlsDisabled(): boolean {
    return (this.dynamicSchema() as DynamicFormSchemaList).items.every((item) => {
      return item.editable !== undefined && item.editable !== null && !item.editable;
    });
  }

  ngOnInit(): void {
    const dependsOn = this.dynamicSchema()?.dependsOn;

    dependsOn?.forEach((depend) => {
      this.dynamicForm()?.valueChanges.pipe(
        map((changes: Record<string, unknown>) => {
          return changes[depend];
        }),
        filter((x) => x != null),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.changeDetectorRef.markForCheck();
      });
    });
    if (
      this.dynamicSchema()?.editable !== undefined
      && !this.dynamicSchema()?.editable
    ) {
      this.dynamicForm()?.get(this.dynamicSchema().controlName)?.disable();
    }

    if (this.dynamicSchema()?.hidden) {
      (this.dynamicForm().controls[this.dynamicSchema().controlName] as CustomUntypedFormField)?.hidden$?.next(true);
    }
  }

  /**
   * Seeds a list schema's `default` entries on a create form. Lived inside `ix-list` before the
   * move to `tn-form-list`, which knows nothing about chart schemas — and it never belonged
   * there: it reads `itemsSchema` and emits one add per default, both of which are this
   * component's own concern.
   *
   * Deferred to `AfterViewInit` (and a macrotask beyond it) as it was: adding controls seeds the
   * `FormArray` the view has just rendered, so it cannot run during that render.
   *
   * Seeding waits for the list to be *visible*, which is what `ix-list` got for free by living
   * under `@if (!(isHidden$ | async))`. The question has to be asked of `hidden$` rather than
   * `schema.hidden`, because a `show_if` relation or a subquestion hides a question through the
   * subject alone: `app-schema.service` pairs `hidden$.next(true)` with `disable()` and leaves the
   * static flag `false`.
   *
   * Seeding a hidden list would not just add invisible rows, it would un-disable them:
   * `FormArray.push` runs `updateValueAndValidity` → `_setInitialStatus`, which re-enables an
   * array once it holds an enabled control, so the rows would reach the install payload of a
   * question the user never saw.
   */
  ngAfterViewInit(): void {
    const schema = this.dynamicSchema();
    if (
      schema.type !== DynamicFormSchemaType.List
      || this.isEditMode()
      || schema.hidden
      || !schema.default?.length
    ) {
      return;
    }

    // The macrotask is cancelled on destroy rather than left to expire harmlessly: its callback
    // subscribes with `takeUntilDestroyed`, which registers the `DestroyRef` hook at subscribe
    // time and throws NG0911 once the view is gone. A list nested in a `show_if`-gated dict is
    // torn down by the relation's own `timer(0)`, one macrotask ahead of this one.
    const seedTimeout = setTimeout(() => {
      const seed = (): void => {
        schema.default?.forEach((defaultValue: Record<string, unknown>) => {
          this.addControl(
            schema.itemsSchema?.map((item: ChartSchemaNode) => ({
              ...item,
              schema: {
                ...item.schema,
                default: defaultValue?.[item.variable]
                  ?? (typeof defaultValue !== 'object' ? defaultValue : item.schema.default),
              },
            })),
          );
        });

        this.changeDetectorRef.markForCheck();
      };

      // A control built outside `app-schema` — a plain `FormArray` — carries no subject and is
      // never hidden.
      const hidden$ = this.isHidden$;
      if (!hidden$) {
        seed();
        return;
      }

      // Waiting for the first *visible* emission rather than reading the subject once: a list
      // gated by a `show_if` is hidden on a `timer(0)` and revealed again whenever the user
      // satisfies the relation, and its object-shaped defaults have nowhere else to come from —
      // `AppSchemaService.getItemsToPopulate` skips those deliberately. `take(1)` is what keeps a
      // question that is hidden and shown repeatedly from stacking a fresh set of defaults each
      // time, which is what `ix-list` did by being rebuilt on every re-show.
      hidden$.pipe(
        filter((isHidden) => !isHidden),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => seed());
    });

    this.destroyRef.onDestroy(() => clearTimeout(seedTimeout));
  }

  get getFormArray(): UntypedFormArray {
    return this.dynamicForm().controls[this.dynamicSchema().controlName] as UntypedFormArray;
  }

  get isHidden$(): BehaviorSubject<boolean> {
    return (this.dynamicForm().controls[this.dynamicSchema().controlName] as CustomUntypedFormField)?.hidden$;
  }

  addControl(schema?: ChartSchemaNode[]): void {
    const dynamicSchema = this.dynamicSchema();
    if (dynamicSchema.type === DynamicFormSchemaType.List) {
      this.addListItem.emit({
        array: this.getFormArray,
        schema: schema || dynamicSchema.itemsSchema,
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

  protected asInputSchema(schema: DynamicFormSchemaNode): DynamicFormSchemaInput {
    return schema as DynamicFormSchemaInput;
  }

  protected toInputType(inputType: string | undefined): InputType {
    switch (inputType) {
      case 'password':
        return InputType.Password;
      case 'number':
        return InputType.Number;
      default:
        return InputType.PlainText;
    }
  }

  protected asUriSchema(schema: DynamicFormSchemaNode): DynamicFormSchemaUri {
    return schema as DynamicFormSchemaUri;
  }

  protected asDictSchema(schema: DynamicFormSchemaNode): DynamicFormSchemaDict {
    return schema as DynamicFormSchemaDict;
  }

  protected asTextSchema(schema: DynamicFormSchemaNode): DynamicFormSchemaText {
    return schema as DynamicFormSchemaText;
  }

  protected asListSchema(schema: DynamicFormSchemaNode): DynamicFormSchemaList {
    return schema as DynamicFormSchemaList;
  }

  protected asSelectSchema(schema: DynamicFormSchemaNode): DynamicFormSchemaSelect {
    return schema as DynamicFormSchemaSelect;
  }

  protected asEnumSchema(schema: DynamicFormSchemaNode): DynamicFormSchemaEnum {
    return schema as DynamicFormSchemaEnum;
  }

  protected asExplorerSchema(schema: DynamicFormSchemaNode): DynamicFormSchemaExplorer {
    return schema as DynamicFormSchemaExplorer;
  }
}
