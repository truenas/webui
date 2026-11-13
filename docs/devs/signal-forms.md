# Signal forms

Angular's signal forms (`form()` from `@angular/forms/signals`) can be used for a form in this app alongside Reactive
Forms. This page is the pattern. The background, the measurements and the decision to adopt them in stages are in
[signal-forms-spike.md](signal-forms-spike.md) (NAS-145110, epic NAS-145108).

> **Pilot only, for now.** Until the pilot (NAS-145171) ends in a decision to continue, write new forms and change
> existing ones with Reactive Forms as before. Use this page for the pilot forms.

## A side-panel form

```ts
interface ServerModel {
  name: string;
  protocol: 'http' | 'https';
  port: number | null;
  aliases: { host: string }[];
}

@Component({
  selector: 'ix-server-form',
  template: `
    <ix-form [fieldTree]="form" [submitHandler]="handleSubmit" (closed)="closed.emit($event)">
      <tn-form-field [label]="'Name' | translate">
        <tn-input [formField]="form.name"></tn-input>
      </tn-form-field>
      @if (!form.port().hidden()) {
        <tn-form-field [label]="'Port' | translate">
          <tn-input [formField]="form.port" [inputType]="InputType.Number"></tn-input>
        </tn-form-field>
      }
      @for (row of form.aliases; track row) { ... }
    </ix-form>
  `,
  imports: [signalFormImports, IxFormComponent, TnFormFieldComponent, TnInputComponent, TranslateModule],
  providers: [SignalFormErrors],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerFormComponent extends IxFormHostForm<boolean, ServerModel> implements OnInit {
  private serverErrors = inject(SignalFormErrors);

  private readonly model = signal<ServerModel>({ name: '', protocol: 'http', port: null, aliases: [] });

  protected readonly form = form(this.model, (path) => {
    required(path.name);
    hidden(path.port, { when: ({ valueOf }) => valueOf(path.protocol) !== 'https' });
    required(path.port);
    applyEach(path.aliases, (row) => required(row.host));
    this.serverErrors.apply(path);
  });

  ngOnInit(): void {
    this.loadFormConfig(this.api.call('server.config'), (config) => this.model.set(config));
  }

  protected readonly handleSubmit = (): SubmitResult => ({
    request$: this.api.call('server.update', [activeValue(this.form)]),
    successMessage: this.translate.instant(T('Settings saved')),
  });
}
```

What each piece does:

| Piece | Where | Does |
|---|---|---|
| `<ix-form [fieldTree]>` | `ix-form.component.ts` | The signal path of `<ix-form>`. Save, loading, the snackbar, `changedValues`, unsaved changes and the side-panel contract (`canSubmit`, `submit`, `isBusy`) all follow the field tree. Takes `[formGroup]` or `[fieldTree]`, never both. |
| `IxFormHostForm` | `ix-form-host-form.directive.ts` | `form` may be a field tree. `loadFormConfig` copies the config before `patch` sees it, then takes the baseline and resets the form to pristine. |
| `SignalFormErrors` | `signal-forms/signal-form-errors.service.ts` | Pins API validation errors under fields, row paths included. Provide it on the form and call `apply(path)` in the schema; `<ix-form>` connects it and sends failed saves to it. |
| `signalFormImports` | `signal-forms/ix-signal-error-dismiss.directive.ts` | `FormField`, plus the directive that makes dismissing a server error unblock Save. Import this instead of `FormField`. |
| `activeValue()` | `signal-forms/signal-forms.utils.ts` | The model without hidden or disabled fields. Build payloads from it. |
| `toFormModel()` | same | An unfrozen copy, for store or API data going into a model. |
| `errorTarget()` | same | The cast a field-targeted error needs under `strict: false`. |

## Rules

**Build payloads from `activeValue(form)`, not the model.** A Reactive form drops a disabled control from `.value`; a
signal form keeps hidden and disabled fields in the model. Sending the model sends whatever the user typed into a
field before it was hidden. `FormSubmitEvent.changedValues` already leaves them out; `allValues` is the whole model,
like `getRawValue()`.

**Copy store and API data into the model with `toFormModel()`.** Signal forms write a tracking symbol onto every array
row, so a frozen row throws a `TypeError`, sometimes from an internal effect, away from the line that caused it. NgRx
freezes state in dev mode. `editData` and `loadFormConfig` already copy; anything else you `set` into a model is yours
to copy. A form with rows that come from a store needs a spec that loads frozen data.

**Server errors go through `SignalFormErrors`, not `submit()`.** Angular's `submit()` errors only clear when their own
field changes, so a verdict answered from another field (Force on an unreachable NTP server) would leave Save disabled
for good. The service follows `FormErrorHandlerService`: editing a flagged field drops its error, editing any other
field drops them all, and dismissing one drops that one. A path the form does not show goes to the error modal. Pass
`fieldsMap` to `handleValidationErrors()` when the API names a field differently; outside `<ix-form>`, call
`connect(form)` and `handleValidationErrors(error)` yourself.

**Use `{ when }`.** `hidden(path, fn)` and `disabled(path, fn)` are deprecated in 22.2; write
`hidden(path, { when: fn })`.

**Error messages.** `tn-form-field` shows a rule's own `message` first, then the app-wide resolver
(`tn-form-field-errors.provider.ts`), which knows the signal forms kinds: `required`, `min`, `max`, `minLength`,
`maxLength` (the list wording for an array field), `pattern` and `email`. A custom rule returns
`{ kind, message }` with a translated message.

**Cross-field rules need a cast.** Under the repo's `strict: false`, `fieldTree: fieldTree.other` does not compile.
Wrap it: `{ kind: 'mismatch', message, fieldTree: errorTarget(fieldTree.other) }`.

**Rows are tracked by object.** Keep rows as objects. With a `string[]` model, per-row state (touched, errors) is
tracked by index and stays behind when a row above is removed.

## Specs

- Find controls by label with `TnFormControlHarness.with({ label })`, which reads and fills `tn-input`, `tn-select`,
  `tn-checkbox` and the rest. `[formField]` leaves no `formControlName` attribute, so a selector built on one finds
  nothing. For rows, `TnInputHarness.with({ ancestor: 'tn-form-list' })`.
- Compare row payloads as JSON (`JSON.parse(JSON.stringify(payload))`): the row symbol is enumerable, so `toEqual` and
  lodash `isEqual` see it. The wire payload does not.
- `setup-jest.ts` mocks `ErrorHandlerService` and `FormErrorHandlerService` globally. `SignalFormErrors` is provided
  by the form itself, so it is real in a spec; spy on `handleValidationErrors` to check routing, or let it run to check
  messages under fields.
- `signal-forms-spike/signal-forms-parity.spec.ts` runs one 25-test behaviour contract against a Reactive form and a
  signal form built this way. Change the contract, not one side, when behaviour should change.

## Not covered yet

- **`ix-form-renderer` and `ix-dynamic-form`** stay on Reactive Forms. Renderer forms already get conditional fields
  from `visibleWhen`/`enabledWhen`, so moving their internals gains nothing until the pilot decides; `ix-dynamic-form`
  is NAS-145172.
- **`ix-editable`** and `ValidationErrorCommunicationService` are Reactive only.
- **Composite controls** (the webui `ControlValueAccessor`s): see the table below before binding one with
  `[formField]`.

### Composite controls

`signal-forms/composite-controls.signal-compat.spec.ts` binds each of the webui composites with `[formField]` and
compares it with `formControlName`. Values go both ways and mark the field dirty for all of them.

| Control | `[formField]` |
|---|---|
| `ix-code-editor`, `ix-filter-select-list`, `ix-unused-disk-select`, `ix-ssh-credentials-select` / `ix-cloud-credentials-select` | Work, same `data-test` ids |
| `ix-ip-input-with-netmask`, `ix-scheduler`, `ix-ordered-listbox` | Work. Their ids came from `controlDirective.name`, which a `[formField]` control lacks, so `input-address` and the like vanished; they now go through `injectControlName()` and match |
| `ix-user-combobox`, `ix-group-combobox` and other `DirectoryFieldBase` pickers | **Broken.** They call `ngControl.control.setValue()` and `addAsyncValidators()`, which the interop control lacks: rendering throws unless `validateExistence` is off, and Add New always throws. Needs a signal path in `directory-field.base.ts` before a pilot form uses one |
| `ix-ip-input-with-netmask`, `ix-code-editor` | `RegisteredControlDirective` never registers them with `IxFormService`, which only matters to Reactive error focus |

Under `[formField]`, Angular also sets a control's `required`, `disabled` and `name` inputs from the field state (read
from Angular's source, not tested here). A composite with a `required` input (`ix-scheduler`, `ix-unused-disk-select`,
the credentials selects, `ix-ip-input-with-netmask`) then follows the schema instead of the template binding.
