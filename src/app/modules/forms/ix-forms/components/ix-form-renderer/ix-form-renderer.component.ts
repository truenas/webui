import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, isDevMode, OnInit,
  output, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnAutocompleteComponent, TnCheckboxComponent, TnChipInputComponent, TnFormFieldComponent,
  TnFormSectionComponent, TnInputComponent, TnSelectComponent, TnSelectOption,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import { Observable, take } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { IxFormComponent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import {
  FormDefinition, FormFieldDefinition, FormFieldType, FormSectionDefinition, InputFieldDefinition,
} from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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
  /** Explicit DOM id for the control host, or undefined to leave it unset. */
  id: string | undefined;
  type: FormFieldType;
  label: TranslatedString;
  tooltip: TranslatedString;
  hint: TranslatedString;
  placeholder: TranslatedString;
  required: boolean;
  readonly: boolean;
  /** Static disabled flag from the definition; never re-enabled by predicates. */
  disabled: boolean;
  inputType: InputType;
  multiline: boolean;
  rows: number;
  multiple: boolean;
  requireSelection: boolean;
  options: Observable<TnSelectOption[]> | undefined;
  /** Free-text chip suggestions (chips field, string mode). */
  suggestions: Observable<string[]> | undefined;
  /** Whether typed values become chips (chips field); false = options-only. */
  allowCustomValue: boolean;
  /** Shows the field only when true; while false the control is disabled. */
  visibleWhen: ((value: object) => boolean) | undefined;
  /** Enables the (visible) field only when true. */
  enabledWhen: ((value: object) => boolean) | undefined;
}

interface RenderSection {
  title: TranslatedString;
  tooltip: TranslatedString;
  fields: RenderField[];
  /** Shows the whole fieldset only when true; while false its controls disable. */
  visibleWhen: ((value: object) => boolean) | undefined;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormFieldComponent,
    TnFormSectionComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TnAutocompleteComponent,
    TnChipInputComponent,
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

  /**
   * Emitted on a successful submit when hosted in a `<tn-side-panel>` (forwarded
   * from the inner `<ix-form>`). Never fires in legacy SlideIn mode — there the
   * inner `<ix-form>` closes the slide-in directly.
   */
  readonly closed = output<boolean>();

  /** The inner `<ix-form>`, used to expose the host-facing dual-host surface. */
  private readonly ixForm = viewChild(IxFormComponent);

  /**
   * Whether the form can be submitted right now — a `<tn-side-panel>` host reads
   * this to enable/disable its footer Save. Delegates to the inner `<ix-form>`;
   * false until the view (and thus the child) initializes.
   */
  readonly canSubmit = computed(() => this.ixForm()?.canSubmit() ?? false);

  /**
   * Reactive mirror of {@link canSubmit} for hosts that can't read a child signal
   * directly (a `<tn-side-panel>` wrapper whose ref to this component is a
   * non-signal `@ViewChild`, e.g. because it gets ng-mocks-mocked elsewhere).
   */
  readonly canSubmitChange = output<boolean>();

  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected form!: FormGroup;
  protected sections: RenderSection[] = [];
  protected title = '';
  protected addTitle = '';
  protected editTitle = '';
  /** Public so a `<tn-side-panel>` host can role-gate its footer Save. */
  requiredRoles: Role[] = [];

  /** True while `loadData` is in flight; forwarded to `<ix-form>`. */
  protected readonly externalLoading = signal(false);
  /** Change-tracking baseline captured after `loadData` patches the form. */
  protected readonly loadedSnapshot = signal<Partial<T> | null>(null);
  /** `loadData` forms are edits; lets the title resolve to editTitle. */
  protected readonly resolvedEditMode = signal<boolean | null>(null);

  /**
   * Per-field/-section visibility maps driving the template `@if`. Recomputed
   * from `visibleWhen` on every value change; entries without a `visibleWhen`
   * predicate never appear here (and are treated as always visible).
   */
  protected readonly fieldVisible = signal<Record<string, boolean>>({});
  protected readonly sectionVisible = signal<Record<number, boolean>>({});

  constructor() {
    // Re-emit validity to a host that mirrors it into its own signal.
    effect(() => this.canSubmitChange.emit(this.canSubmit()));
  }

  ngOnInit(): void {
    const definition = this.definition();

    if (isDevMode() && definition.loadData && this.editData() != null) {
      console.warn(
        '[ix-form-renderer] Both `loadData` and `editData` were provided — they are mutually '
        + 'exclusive. `editData` patches synchronously while `loadData` patches after its async fetch, '
        + 'producing a double patch and a confused change-tracking baseline. Use exactly one.',
      );
    }

    const sections = definition.sections ?? [{ fields: definition.fields ?? [] }];
    if (isDevMode()) {
      this.warnIgnoredFieldProps(sections);
    }
    this.form = this.buildForm(sections, definition.formValidators);
    this.sections = sections.map((section) => this.toRenderSection(section));
    this.title = this.translateOrEmpty(definition.title);
    this.addTitle = this.translateOrEmpty(definition.addTitle);
    this.editTitle = this.translateOrEmpty(definition.editTitle);
    this.requiredRoles = definition.requiredRoles ?? [];
    this.resolvedEditMode.set(this.isEditMode());

    this.setupConditionalState();

    if (definition.loadData) {
      this.runLoadData(definition.loadData);
    }
  }

  /** Host entry point (e.g. `<tn-side-panel>` footer Save) to trigger submission. */
  submit(): void {
    this.ixForm()?.submit();
  }

  /** Host hook (`<tn-side-panel>` closeGuard) to confirm before discarding edits. */
  hasUnsavedChanges(): boolean {
    return Boolean(this.form?.dirty);
  }

  /**
   * Wires `visibleWhen`/`enabledWhen` (field and section level), then re-applies
   * on every value change. Hidden / disabled-when states are both expressed by
   * disabling the control (so it drops out of validation and `.value`), with
   * visibility additionally toggling the template `@if`. Enable/disable use
   * `emitEvent: false` to avoid re-triggering the subscription.
   *
   * The initial pass is split to keep edit/loadData forms correct: when a patch
   * is coming (`editData`/`loadData`), only the visibility signals are seeded —
   * from the entity-merged value — and the authoritative enable/disable is
   * deferred to the patch's own `valueChanges`, so it runs against the patched
   * values rather than the pre-patch defaults. Create-mode forms have nothing to
   * patch, so the full state applies at once.
   */
  private setupConditionalState(): void {
    const hasConditionalLogic = this.sections.some(
      (section) => section.visibleWhen || section.fields.some((field) => field.visibleWhen || field.enabledWhen),
    );
    if (!hasConditionalLogic) {
      return;
    }

    const willPatch = this.editData() != null || Boolean(this.definition().loadData);
    if (willPatch) {
      const initial = { ...(this.form.getRawValue() as object), ...(this.editData() as object ?? {}) };
      this.applyConditionalState(initial, false);
    } else {
      this.applyConditionalState();
    }

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyConditionalState());
  }

  private applyConditionalState(value: object = this.form.getRawValue() as object, toggleControls = true): void {
    const fieldVisibility: Record<string, boolean> = {};
    const sectionVisibility: Record<number, boolean> = {};

    this.sections.forEach((section, index) => {
      const sectionShown = section.visibleWhen ? section.visibleWhen(value) : true;
      if (section.visibleWhen) {
        sectionVisibility[index] = sectionShown;
      }

      for (const field of section.fields) {
        const fieldShown = sectionShown && (field.visibleWhen ? field.visibleWhen(value) : true);
        if (field.visibleWhen) {
          fieldVisibility[field.name] = fieldShown;
        }

        const managed = Boolean(section.visibleWhen) || Boolean(field.visibleWhen) || Boolean(field.enabledWhen);
        if (!toggleControls || !managed) {
          continue;
        }

        const enabled = fieldShown && !field.disabled && (field.enabledWhen ? field.enabledWhen(value) : true);
        const control = this.form.controls[field.name];
        if (control && control.enabled !== enabled) {
          if (enabled) {
            control.enable({ emitEvent: false });
          } else {
            control.disable({ emitEvent: false });
          }
        }
      }
    });

    // Only push when the maps actually change — signals use reference equality,
    // so re-setting an equal-by-value object on every keystroke would tick CD.
    if (!isEqual(this.fieldVisible(), fieldVisibility)) {
      this.fieldVisible.set(fieldVisibility);
    }
    if (!isEqual(this.sectionVisible(), sectionVisibility)) {
      this.sectionVisible.set(sectionVisibility);
    }
  }

  /** Template guard: fields without `visibleWhen` are always shown. */
  protected isFieldVisible(field: RenderField): boolean {
    if (!field.visibleWhen) {
      return true;
    }
    return this.fieldVisible()[field.name] ?? false;
  }

  /** Template guard: sections without `visibleWhen` are always shown. */
  protected isSectionVisible(index: number, section: RenderSection): boolean {
    if (!section.visibleWhen) {
      return true;
    }
    return this.sectionVisible()[index] ?? false;
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
      error: (error: unknown) => {
        // Surface the failure instead of silently rendering a blank form, so
        // every loadData config inherits error reporting without each having to
        // repeat a catchError. A config may still pre-handle the error in its
        // own Observable; this is the shared fallback.
        this.externalLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  /**
   * Dev-only guard: a few declarative props are honored by only a subset of
   * control types — the template binds `placeholder` on input/textarea/combobox
   * and `readonly` on input/textarea. Setting one on an unsupported type (e.g.
   * `readonly` on a checkbox, `placeholder` on a select) silently does nothing.
   * Warn at author time, mirroring the loadData/editData guard, so the mistake
   * surfaces in the console rather than as a quietly-missing attribute.
   */
  private warnIgnoredFieldProps(sections: FormSectionDefinition<T>[]): void {
    for (const section of sections) {
      for (const field of section.fields) {
        const ignored: string[] = [];
        if (field.placeholder && (field.type === 'checkbox' || field.type === 'select')) {
          ignored.push('placeholder');
        }
        if (field.readonly && field.type !== 'input' && field.type !== 'textarea') {
          ignored.push('readonly');
        }
        if (ignored.length > 0) {
          console.warn(
            `[ix-form-renderer] Field "${field.name}" (type "${field.type}") sets `
            + `${ignored.join(', ')}, which the renderer does not render for this control type. `
            + 'Remove the prop, or use a control type that supports it.',
          );
        }
      }
    }
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
      case 'chips':
        return [];
      default:
        return '';
    }
  }

  private toRenderSection(section: FormSectionDefinition<T>): RenderSection {
    return {
      title: this.translateOrEmpty(section.title),
      tooltip: this.translateOrEmpty(section.tooltip),
      fields: section.fields.map((field) => this.toRenderField(field)),
      visibleWhen: section.visibleWhen as ((value: object) => boolean) | undefined,
    };
  }

  private toRenderField(field: FormFieldDefinition<T>): RenderField {
    const inputType = field.type === 'input' ? inputTypeMap[field.inputType ?? 'text'] : InputType.PlainText;

    return {
      name: field.name,
      id: field.id,
      type: field.type,
      label: this.translateOrEmpty(field.label),
      tooltip: this.translateOrEmpty(field.tooltip),
      hint: this.translateOrEmpty(field.hint),
      placeholder: this.translateOrEmpty(field.placeholder),
      required: Boolean(field.required),
      readonly: Boolean(field.readonly),
      disabled: Boolean(field.disabled),
      inputType,
      multiline: field.type === 'textarea',
      rows: field.type === 'textarea' ? (field.rows ?? 4) : 4,
      multiple: field.type === 'select' ? Boolean(field.multiple) : false,
      requireSelection: field.type === 'combobox' ? (field.requireSelection ?? true) : true,
      options: field.type === 'select' || field.type === 'combobox' || field.type === 'chips'
        ? field.options
        : undefined,
      suggestions: field.type === 'chips' ? field.suggestions : undefined,
      allowCustomValue: field.type === 'chips' ? (field.allowCustomValue ?? true) : true,
      visibleWhen: field.visibleWhen as ((value: object) => boolean) | undefined,
      enabledWhen: field.enabledWhen as ((value: object) => boolean) | undefined,
    };
  }

  /**
   * Resolves a marker string eagerly via `translate.instant` (once, at init),
   * not the `| translate` pipe. Intentional: slide-in forms are recreated on
   * each open, so they pick up a language change anyway. A renderer left mounted
   * across a runtime locale switch would NOT re-translate its labels/titles.
   */
  private translateOrEmpty(value: string | undefined): TranslatedString {
    return value ? (this.translate.instant(value) as TranslatedString) : '';
  }
}
