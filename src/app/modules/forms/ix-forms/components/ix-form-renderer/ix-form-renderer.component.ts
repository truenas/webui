import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnAutocompleteComponent, TnCheckboxComponent, TnFormFieldComponent,
  TnInputComponent, TnSelectComponent, TnSelectOption,
} from '@truenas/ui-components';
import { Observable, take } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxFormComponent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import {
  FormDefinition, FormFieldDefinition, FormFieldType, FormSectionDefinition, InputFieldDefinition,
} from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { TranslatedString } from 'app/modules/translate/translate.helper';

const inputTypeMap: Record<NonNullable<InputFieldDefinition<object>['inputType']>, InputType> = {
  text: InputType.PlainText,
  number: InputType.Number,
  password: InputType.Password,
  email: InputType.Email,
};

/**
 * Flat, fully-resolved field view-model the template renders. Keeping all
 * properties present (rather than a discriminated union) avoids template
 * type-narrowing pitfalls under strict templates — the template never reads
 * a property that may be absent.
 */
interface RenderField {
  name: string;
  type: FormFieldType;
  label: TranslatedString;
  tooltip: TranslatedString;
  hint: TranslatedString;
  placeholder: TranslatedString;
  required: boolean;
  inputType: InputType;
  multiline: boolean;
  rows: number;
  multiple: boolean;
  requireSelection: boolean;
  options: Observable<TnSelectOption[]> | undefined;
}

interface RenderSection {
  title: TranslatedString;
  tooltip: TranslatedString;
  fields: RenderField[];
}

/**
 * Renders a declarative {@link FormDefinition} into a fully-functional
 * slide-in form. Builds the `FormGroup` from the field list, wires it into
 * `<ix-form>` (which owns the chrome, change tracking and submit lifecycle)
 * and renders each field as a `<tn-form-field>` wrapping the matching tn-*
 * control. API/validation errors surface through `tn-form-field`'s resolver
 * (`provideTnFormFieldErrors`, wired app-wide) fed by `FormErrorHandlerService`.
 *
 * @example
 * <ix-form-renderer [definition]="definition" [editData]="editingEntity" />
 */
@Component({
  selector: 'ix-form-renderer',
  templateUrl: './ix-form-renderer.component.html',
  styleUrl: './ix-form-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    IxFormComponent,
    IxFieldsetComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TnAutocompleteComponent,
    TranslateModule,
  ],
})
export class IxFormRendererComponent<T extends object = Record<string, unknown>> implements OnInit {
  /** The declarative form description. Read once on init. */
  readonly definition = input.required<FormDefinition<T>>();

  /** Entity data for edit mode; forwarded to `<ix-form>` for auto-patching. */
  readonly editData = input<Partial<T> | object | null | undefined>(null);

  /** Explicit edit-mode override; forwarded to `<ix-form>`. */
  readonly isEditMode = input<boolean | null>(null);

  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected form!: FormGroup;
  protected sections: RenderSection[] = [];
  protected title = '';
  protected addTitle = '';
  protected editTitle = '';
  protected requiredRoles: Role[] = [];
  protected submitHandler!: FormDefinition<T>['submit'];

  /** True while `loadData` is in flight; forwarded to `<ix-form>`. */
  protected readonly externalLoading = signal(false);
  /** Change-tracking baseline captured after `loadData` patches the form. */
  protected readonly loadedSnapshot = signal<Partial<T> | null>(null);
  /** `loadData` forms are edits; lets the title resolve to editTitle. */
  protected readonly resolvedEditMode = signal<boolean | null>(null);

  ngOnInit(): void {
    const definition = this.definition();
    const sections = definition.sections ?? [{ fields: definition.fields ?? [] }];
    this.form = this.buildForm(sections, definition.formValidators);
    this.sections = sections.map((section) => this.toRenderSection(section));
    this.title = this.translateOrEmpty(definition.title);
    this.addTitle = this.translateOrEmpty(definition.addTitle);
    this.editTitle = this.translateOrEmpty(definition.editTitle);
    this.requiredRoles = definition.requiredRoles ?? [];
    this.submitHandler = definition.submit;
    this.resolvedEditMode.set(this.isEditMode());

    if (definition.loadData) {
      this.runLoadData(definition.loadData);
    }
  }

  private runLoadData(loadData: () => Observable<Partial<T>>): void {
    this.externalLoading.set(true);
    this.resolvedEditMode.set(true);
    loadData().pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.form.markAsPristine();
        this.loadedSnapshot.set(this.form.getRawValue() as Partial<T>);
        this.externalLoading.set(false);
      },
      error: () => this.externalLoading.set(false),
    });
  }

  private buildForm(sections: FormSectionDefinition<T>[], formValidators?: ValidatorFn[]): FormGroup {
    const controls: Record<string, unknown> = {};

    for (const section of sections) {
      for (const field of section.fields) {
        const validators = [...(field.validators ?? [])];
        if (field.required) {
          validators.push(Validators.required);
        }
        const options = { validators, asyncValidators: field.asyncValidators ?? [] };

        const value = field.value === undefined ? this.defaultValueFor(field) : field.value;
        controls[field.name] = field.disabled
          ? this.fb.control({ value, disabled: true }, options)
          : this.fb.control(value, options);
      }
    }

    return this.fb.group(controls, { validators: formValidators ?? [] });
  }

  private defaultValueFor(field: FormFieldDefinition<T>): unknown {
    switch (field.type) {
      case 'checkbox':
        return false;
      case 'select':
        return field.multiple ? [] : null;
      case 'combobox':
        return null;
      default:
        return '';
    }
  }

  private toRenderSection(section: FormSectionDefinition<T>): RenderSection {
    return {
      title: this.translateOrEmpty(section.title),
      tooltip: this.translateOrEmpty(section.tooltip),
      fields: section.fields.map((field) => this.toRenderField(field)),
    };
  }

  private toRenderField(field: FormFieldDefinition<T>): RenderField {
    const inputType = field.type === 'input' ? inputTypeMap[field.inputType ?? 'text'] : InputType.PlainText;

    return {
      name: field.name,
      type: field.type,
      label: this.translateOrEmpty(field.label),
      tooltip: this.translateOrEmpty(field.tooltip),
      hint: this.translateOrEmpty(field.hint),
      placeholder: this.translateOrEmpty(field.placeholder),
      required: Boolean(field.required),
      inputType,
      multiline: field.type === 'textarea',
      rows: field.type === 'textarea' ? (field.rows ?? 4) : 4,
      multiple: field.type === 'select' ? Boolean(field.multiple) : false,
      requireSelection: field.type === 'combobox' ? (field.requireSelection ?? true) : true,
      options: field.type === 'select' || field.type === 'combobox' ? field.options : undefined,
    };
  }

  private translateOrEmpty(value: string | undefined): TranslatedString {
    return value ? (this.translate.instant(value) as TranslatedString) : '';
  }
}
