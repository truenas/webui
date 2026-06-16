// cspell:ignore ntpserver maxpoll minpoll
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { TnSelectOption } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { FormSubmitEvent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';

/**
 * Declarative form description rendered by `<ix-form-renderer>`.
 *
 * This is the Phase 1 ("simple") shape: a flat list of primitive fields,
 * optionally grouped into titled sections, with a submit handler. It covers
 * CRUD forms whose fields are static and whose only logic is per-field /
 * form-level validation. Anything needing conditional visibility, dynamic
 * field sets, custom widgets, FormArrays, wizards or payload reshaping should
 * stay on the hand-written `<ix-form>` + template approach.
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
export interface FormDefinition<T extends object = Record<string, unknown>> {
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
   * Single-section convenience: fields rendered in one untitled fieldset.
   * Mutually exclusive with `sections` — when both are set, `sections` wins.
   */
  fields?: FormFieldDefinition<T>[];

  /**
   * Multi-section form: each entry renders as one `<ix-fieldset>`.
   */
  sections?: FormSectionDefinition<T>[];

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
   * an edit. Mutually exclusive with `editData`. Handle load errors inside the
   * returned Observable (e.g. `catchError`) — the renderer just clears loading.
   */
  loadData?: () => Observable<Partial<T>>;

  /**
   * Builds the API request and success message from the submitted values.
   * Reuses `<ix-form>`'s submit contract verbatim, so create-vs-update
   * branching, success callbacks and payload overrides all work here.
   */
  submit: (event: FormSubmitEvent<T>) => SubmitResult;
}

export interface FormSectionDefinition<T extends object = Record<string, unknown>> {
  /** Fieldset title (untranslated marker); omit for an untitled section. */
  title?: string;
  tooltip?: string;
  fields: FormFieldDefinition<T>[];
}

export type FormFieldType = 'input' | 'textarea' | 'checkbox' | 'select' | 'combobox';

interface BaseFieldDefinition<T extends object> {
  /** Form control name; also the key in the submitted value object. */
  name: keyof T & string;
  type: FormFieldType;
  /** Untranslated marker strings — the renderer translates them. */
  label?: string;
  tooltip?: string;
  hint?: string;
  placeholder?: string;
  /**
   * Shows the required indicator AND adds `Validators.required`. Add any
   * further validators (min, max, pattern, custom) via `validators`.
   */
  required?: boolean;
  /**
   * Control starts disabled. NOTE: Angular's `patchValue` skips disabled
   * controls, so a field that is both `disabled` and populated from `editData`
   * / `loadData` keeps its `value` (or the per-type default) instead of the
   * entity value. Give such a field an explicit `value`, or keep it enabled.
   */
  disabled?: boolean;
  /** Validators added on top of `required`. */
  validators?: ValidatorFn[];
  /** Async validators (e.g. uniqueness checks that hit the API). */
  asyncValidators?: AsyncValidatorFn[];
  /**
   * Initial control value. Defaults per type when omitted:
   * input/textarea → '', checkbox → false, select/combobox → null
   * (multi-select → []).
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

export type FormFieldDefinition<T extends object = Record<string, unknown>> = InputFieldDefinition<T>
  | TextareaFieldDefinition<T>
  | CheckboxFieldDefinition<T>
  | SelectFieldDefinition<T>
  | ComboboxFieldDefinition<T>;
