// cspell:ignore ntpserver maxpoll minpoll
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { TnSelectOption } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { FormSubmitEvent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';

/**
 * Declarative form description rendered by `<ix-form-renderer>`.
 *
 * This is the "simple" shape: a flat list of primitive fields, optionally
 * grouped into titled sections, with a submit handler. It covers CRUD forms
 * whose fields are static, plus single-field conditional visibility/enablement
 * (`visibleWhen`/`enabledWhen`) and read-only fields. Anything needing dynamic
 * field sets, custom widgets (explorer/scheduler/...), FormArrays,
 * wizards, imperative `valueChanges` side-effects, or per-field reactive
 * attributes should stay on the hand-written `<ix-form>` + template approach.
 *
 * The host component owns the definition as an instance property, so it can
 * close over injected services (api, translate, slide-in data) in `submit`
 * and in any `validators`.
 *
 * @example
 * protected definition: FormDefinition<CreateNtpServer> = {
 *   addTitle: T('Add NTP Server'),
 *   editTitle: T('Edit NTP Server'),
 *   requiredRoles: [Role.NetworkGeneralWrite],
 *   sections: [{
 *     title: T('NTP Servers'),
 *     fields: [
 *       { name: 'address', type: 'input', label: T('Address'), required: true },
 *       { name: 'burst', type: 'checkbox', label: T('Burst'), value: false },
 *     ],
 *   }],
 *   submit: (event) => ({
 *     request$: this.api.call('system.ntpserver.create', [event.allValues]),
 *     successMessage: this.translate.instant('NTP server added'),
 *   }),
 * };
 */
/**
 * Fields are supplied EITHER as a flat `fields` list (one untitled fieldset)
 * OR as `sections` (one `<tn-form-section>` each) — never both. Enforced at the
 * type level so the precedence rule can't be tripped accidentally.
 */
type FormFieldsOrSections<T extends object>
  = { fields: FormFieldDefinition<T>[]; sections?: never }
    | { sections: FormSectionDefinition<T>[]; fields?: never };

interface FormDefinitionBase<T extends object> {
  /**
   * User-facing strings are untranslated markers (`T('...')`) or helptext
   * constants — the renderer runs them through `TranslateService.instant`.
   * Do NOT pre-translate them at the call site.
   *
   * Explicit modal title; wins over addTitle/editTitle.
   */
  title?: string;
  /** Modal title in create mode. */
  addTitle?: string;
  /** Modal title in edit mode. */
  editTitle?: string;
  /** Roles required to submit the form. */
  requiredRoles?: Role[];

  /**
   * FormGroup-level validators (e.g. cross-field rules such as
   * `greaterThanFg('maxpoll', ['minpoll'], ...)`).
   */
  formValidators?: ValidatorFn[];

  /**
   * Async loader for singleton-config forms whose initial values come from an
   * API call (e.g. `mail.config`, `audit.config`) rather than `editData`. The
   * renderer shows the loading bar, fetches once on init, patches the form and
   * captures the result as the change-tracking baseline. The form is treated as
   * an edit. Mutually exclusive with `editData`. On failure the renderer clears
   * loading and surfaces the error in a modal, so a config need not add its own
   * `catchError` — though it may still pre-handle the error in the returned
   * Observable (e.g. to map it or close the slide-in).
   */
  loadData?: () => Observable<Partial<T>>;

  /**
   * Builds the API request and success message from the submitted values.
   * Reuses `<ix-form>`'s submit contract verbatim, so create-vs-update
   * branching, success callbacks and payload overrides all work here.
   *
   * Unlike the marker strings above (titles/labels, which the renderer
   * translates), `SubmitResult.successMessage` goes straight to the snackbar, so
   * pre-translate it here (`translate.instant(T('...'))`).
   */
  submit: (event: FormSubmitEvent<T>) => SubmitResult;
}

export type FormDefinition<T extends object = Record<string, unknown>>
  = FormDefinitionBase<T> & FormFieldsOrSections<T>;

export interface FormSectionDefinition<T extends object = Record<string, unknown>> {
  /** Fieldset title (untranslated marker); omit for an untitled section. */
  title?: string;
  tooltip?: string;
  /**
   * Conditional visibility for the whole fieldset. The section renders only
   * while this predicate returns true for the current form value; while hidden
   * every control it owns is disabled (dropping out of validation and `.value`).
   * Use for groups of fields gated on one toggle (e.g. peer-auth fields shown
   * only for Mutual CHAP). Per-field `visibleWhen` still applies within a
   * visible section.
   */
  visibleWhen?: (value: T) => boolean;
  fields: FormFieldDefinition<T>[];
}

export type FormFieldType = 'input' | 'textarea' | 'checkbox' | 'select' | 'combobox' | 'chips';

interface BaseFieldDefinition<T extends object> {
  /** Form control name; also the key in the submitted value object. */
  name: keyof T & string;
  type: FormFieldType;
  /**
   * Stable DOM `id` set on the rendered control's host element. Omitted by
   * default; set it only when something outside the form targets the element
   * (e.g. a `document.getElementById` deep-link / scroll-into-view).
   */
  id?: string;
  /** Untranslated marker strings — the renderer translates them. */
  label?: string;
  tooltip?: string;
  hint?: string;
  placeholder?: string;
  /**
   * Adds `Validators.required`. The `*` indicator is then inferred by
   * `tn-form-field` from that validator (reference equality), so every control
   * type — input, checkbox, select and combobox alike — shows it without the
   * renderer threading an explicit `[required]` to each wrapper. Add any
   * further validators (min, max, pattern, custom) via `validators`.
   */
  required?: boolean;
  /**
   * Control starts disabled: value is shown but not editable, and is excluded
   * from the form's `.value` and from `changedValues`. It is still present in
   * `getRawValue()`, so a `submit` reading `allValues` still sends it, and
   * `editData`/`loadData` still patch it (so it displays the entity value).
   */
  disabled?: boolean;
  /** Validators added on top of `required`. */
  validators?: ValidatorFn[];
  /** Async validators (e.g. uniqueness checks that hit the API). */
  asyncValidators?: AsyncValidatorFn[];
  /**
   * Conditional visibility. The field renders only while this predicate returns
   * true for the current form value (re-evaluated on every value change). While
   * hidden the control is disabled, so it drops out of validation and the form's
   * `.value` — it still appears in `getRawValue()`, so reshape in `submit` if a
   * hidden value must not be sent. Replaces hand-written `@if`-wrapped fields.
   */
  visibleWhen?: (value: T) => boolean;
  /**
   * Conditional enablement. The field stays visible but is enabled only while
   * this predicate returns true (re-evaluated on every value change). Disabled
   * controls are excluded from `.value` and validation. Declarative equivalent
   * of the reactive-forms `enabledWhile` pattern.
   */
  enabledWhen?: (value: T) => boolean;
  /**
   * Renders the control read-only (value visible and selectable but not
   * editable). Unlike `disabled`, the control stays enabled, so its value is
   * still submitted and validated. Supported by input/textarea.
   */
  readonly?: boolean;
  /**
   * Initial control value. Defaults per type when omitted:
   * input/textarea → '', checkbox → false, select/combobox → null
   * (multi-select → []), chips → [].
   */
  value?: unknown;
}

export interface InputFieldDefinition<T extends object> extends BaseFieldDefinition<T> {
  type: 'input';
  /** Maps to `<tn-input inputType>` (the library `InputType` enum). Defaults to 'text'. */
  inputType?: 'text' | 'number' | 'password' | 'email';
}

export interface TextareaFieldDefinition<T extends object> extends BaseFieldDefinition<T> {
  type: 'textarea';
  rows?: number;
}

export interface CheckboxFieldDefinition<T extends object> extends BaseFieldDefinition<T> {
  type: 'checkbox';
}

export interface SelectFieldDefinition<T extends object> extends BaseFieldDefinition<T> {
  type: 'select';
  /**
   * Options for the `<tn-select>`. An Observable so API-loaded options work; for
   * a static list wrap it in `of([...])`. The app's `SelectOption[]` is
   * structurally assignable to `TnSelectOption[]`.
   */
  options: Observable<TnSelectOption[]>;
  multiple?: boolean;
}

export interface ComboboxFieldDefinition<T extends object> extends BaseFieldDefinition<T> {
  type: 'combobox';
  /**
   * Options for the searchable `<tn-autocomplete>`. Same shape/semantics as
   * `select`. Suited to long lists filtered as you type (e.g. timezones).
   */
  options: Observable<TnSelectOption[]>;
  /**
   * Require picking an existing option (default true). Set false to commit
   * free text as the value.
   */
  requireSelection?: boolean;
}

export interface ChipsFieldDefinition<T extends object> extends BaseFieldDefinition<T> {
  type: 'chips';
  /**
   * Value-mode options (`{ label, value }`). When provided, chips display the
   * resolved `label` while the form model holds the `value`s (e.g. privilege
   * names shown, privilege ids stored). Omit for free-text chips, where the
   * model holds the typed strings. Set `allowCustomValue: false` alongside this
   * to restrict input to these options.
   */
  options?: Observable<TnSelectOption[]>;
  /**
   * Free-text suggestions offered as the user types (string mode only; ignored
   * when `options` is set). For a static list wrap in `of([...])`.
   */
  suggestions?: Observable<string[]>;
  /**
   * Allow arbitrary typed values to become chips. Defaults to `true` (free-text
   * tags). Set `false` to restrict input to `options`/`suggestions` — required
   * when using value-mode `options`.
   */
  allowCustomValue?: boolean;
}

export type FormFieldDefinition<T extends object = Record<string, unknown>> = InputFieldDefinition<T>
  | TextareaFieldDefinition<T>
  | CheckboxFieldDefinition<T>
  | SelectFieldDefinition<T>
  | ComboboxFieldDefinition<T>
  | ChipsFieldDefinition<T>;
