/* eslint-disable max-classes-per-file, @angular-eslint/component-max-inline-declarations --
   The two implementations sit side by side so they can be read against each other. */
/* eslint-disable angular-file-naming/component-filename-suffix, angular-file-naming/directive-filename-suffix */
/* eslint-disable angular-file-naming/service-filename-suffix */
import {
  ChangeDetectionStrategy, Component, computed, Directive, DOCUMENT, effect, inject, Injectable, InjectionToken, input,
  OnInit, signal, Signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormArray, FormControl, FormGroup, NgControl, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';
import {
  applyEach, form, FormField, hidden, minLength, ReadonlyFieldTree, required, SchemaPath, SchemaPathTree, validateAsync,
  validateTree,
} from '@angular/forms/signals';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormListComponent, TnFormListItemComponent, TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import {
  map, Observable, of, startWith, Subject,
} from 'rxjs';
import { ApiErrorName } from 'app/enums/api.enum';
import { isApiCallError, isApiErrorDetails } from 'app/helpers/api.helper';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { manualValidateErrorKey } from 'app/modules/forms/ix-forms/manual-validate-error.constants';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * NAS-145110 spike only; nothing in the app imports this directory. See `docs/devs/signal-forms-spike.md`.
 *
 * One representative form, written twice, so `signal-forms-parity.spec.ts` can run a single behaviour suite
 * against both. It carries what real forms carry: a required field with an async uniqueness check, a field
 * that only exists for one select value, a checkbox, a list of rows, config loading and API validation errors.
 */
export interface SpikeFormValue {
  name: string;
  protocol: 'http' | 'https';
  port: number | null;
  enabled: boolean;
  aliases: { host: string }[];
}

export type SpikePayload = Omit<SpikeFormValue, 'port'> & { port?: number };

const defaultValue: SpikeFormValue = {
  name: '', protocol: 'http', port: null, enabled: false, aliases: [],
};

@Injectable()
export class SpikeApi {
  isNameTaken(_: string): Observable<boolean> {
    return of(false);
  }

  load(): Observable<SpikeFormValue> {
    return of(defaultValue);
  }

  save(_: SpikePayload): Observable<unknown> {
    return of(true);
  }
}

const protocols = [{ label: 'HTTP', value: 'http' }, { label: 'HTTPS', value: 'https' }];
const nameTakenMessage = 'This name is already in use.' as TranslatedString;
const savedMessage = 'Saved' as TranslatedString;

/**
 * Reactive baseline, written the way forms in this repo are written today.
 */
@Component({
  selector: 'ix-spike-reactive-form',
  template: `
    <ix-form [formGroup]="form" [submitHandler]="handleSubmit" (closed)="closed.emit($event)">
      <tn-form-field label="Name">
        <tn-input formControlName="name"></tn-input>
      </tn-form-field>
      <tn-form-field label="Protocol">
        <tn-select formControlName="protocol" [options]="protocols"></tn-select>
      </tn-form-field>
      @if (isHttps()) {
        <tn-form-field label="Port">
          <tn-input formControlName="port" [inputType]="InputType.Number"></tn-input>
        </tn-form-field>
      }
      <tn-checkbox formControlName="enabled" label="Enabled"></tn-checkbox>
      <tn-form-list label="Aliases" formArrayName="aliases" [control]="form.controls.aliases" (add)="addAlias()">
        @for (row of form.controls.aliases.controls; track row; let i = $index) {
          <tn-form-list-item [formGroupName]="i" (delete)="removeAlias(i)">
            <tn-form-field label="Host">
              <tn-input formControlName="host"></tn-input>
            </tn-form-field>
          </tn-form-list-item>
        }
      </tn-form-list>
    </ix-form>
  `,
  imports: [
    ReactiveFormsModule, IxFormComponent, TnFormFieldComponent, TnInputComponent, TnSelectComponent,
    TnCheckboxComponent, TnFormListComponent, TnFormListItemComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactiveSpikeFormComponent extends IxFormHostForm<boolean, SpikeFormValue> implements OnInit {
  private api = inject(SpikeApi);

  readonly isEdit = input(false);

  protected readonly InputType = InputType;
  protected readonly protocols = protocols;

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
      asyncValidators: [(control: AbstractControl<string>) => this.checkNameIsFree(control)],
    }),
    protocol: new FormControl<'http' | 'https'>('http', { nonNullable: true }),
    port: new FormControl<number | null>({ value: null, disabled: true }, [Validators.required]),
    enabled: new FormControl(false, { nonNullable: true }),
    aliases: new FormArray<FormGroup<{ host: FormControl<string> }>>([]),
  });

  protected readonly isHttps = toSignal(
    this.form.controls.protocol.valueChanges.pipe(
      startWith(this.form.controls.protocol.value),
      map((protocol) => protocol === 'https'),
    ),
    { requireSync: true },
  );

  constructor() {
    super();
    this.form.controls.protocol.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.syncPort());
  }

  ngOnInit(): void {
    if (this.isEdit()) {
      this.loadFormConfig(this.api.load(), (config) => {
        this.form.controls.aliases.clear();
        config.aliases.forEach(() => this.pushAlias());
        this.form.patchValue(config);
        this.syncPort();
      });
    }
  }

  protected addAlias(): void {
    this.pushAlias();
    this.form.markAsDirty();
  }

  protected removeAlias(index: number): void {
    this.form.controls.aliases.removeAt(index);
    this.form.markAsDirty();
  }

  protected readonly handleSubmit = (event: FormSubmitEvent<SpikeFormValue>): SubmitResult => {
    const { port, ...rest } = event.allValues;
    return {
      request$: this.api.save(this.form.controls.port.enabled ? { ...rest, port: port as number } : rest),
      successMessage: savedMessage,
    };
  };

  private pushAlias(): void {
    this.form.controls.aliases.push(new FormGroup({
      host: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    }));
  }

  private syncPort(): void {
    if (this.form.controls.protocol.value === 'https') {
      this.form.controls.port.enable({ emitEvent: false });
    } else {
      this.form.controls.port.disable({ emitEvent: false });
    }
  }

  private checkNameIsFree(control: AbstractControl<string>): Observable<ValidationErrors | null> {
    return this.api.isNameTaken(control.value).pipe(
      map((isTaken) => (isTaken ? { taken: { message: nameTakenMessage } } : null)),
    );
  }
}

const signalServerErrors = new InjectionToken<{ dismiss(field: string): void }>('signalServerErrors');

interface WritableInteropControl {
  name?: string;
  events?: Observable<unknown>;
  setErrors?: (errors: ValidationErrors | null) => void;
}

/**
 * Stand-in for the library change: gives `InteropNgControl` the three members `tn-form-field`, `controlTestId`
 * and `clearDismissibleErrors` expect. It mutates an Angular-owned object, so it proves feasibility only. The
 * real fix belongs in `@truenas/ui-components`, which can read the field state through `FORM_FIELD`.
 */
@Directive({
  selector: '[formField]',
  host: { '[attr.data-control-name]': 'controlName()' },
})
export class SignalFieldBridgeDirective {
  private formField = inject(FormField);
  private serverErrors = inject(signalServerErrors, { optional: true });

  protected readonly controlName = computed(() => this.formField.state().name().split('.').pop() ?? '');

  constructor() {
    const events$ = new Subject<void>();
    const interop = inject(NgControl, { self: true }) as unknown as WritableInteropControl;
    const controlName = this.controlName;
    Object.defineProperty(interop, 'name', { get: () => controlName() });
    interop.events = events$;
    interop.setErrors = () => this.serverErrors?.dismiss(controlName());

    effect(() => {
      const state = this.formField.state();
      state.errors();
      state.invalid();
      state.touched();
      state.dirty();
      events$.next();
    });
  }
}

interface PinnedErrors<T> {
  errors: Partial<Record<keyof T & string, string>>;
  snapshot: T;
}

/**
 * Stand-in for what `FormErrorHandlerService` does for a `FormGroup`. Angular's submission errors only clear when
 * their own field changes, so they would leave Save stuck in the "answer it from another field" case the service's
 * `retirePinnedErrorsOnNextEdit` handles (ticking Force for an unreachable NTP server). Hence a rule, not `submit()`.
 */
export class SignalServerErrors<T extends object> {
  private errorHandler = inject(ErrorHandlerService);
  private document = inject(DOCUMENT);

  private readonly pinned = signal<PinnedErrors<T> | null>(null);

  constructor(private readonly value: Signal<T>) {
    effect(() => this.retireOnEdit(this.value()));
  }

  rule(path: SchemaPathTree<T>): void {
    validateTree(path as SchemaPath<T>, ({ fieldTree }) => {
      const entries = Object.entries(this.pinned()?.errors ?? {}) as [string, string][];
      // Casts because `fieldTree: FieldTree<string>` only type-checks under strictNullChecks, and this repo is on
      // `strict: false`. Every cross-field rule or field-targeted error pays this until that changes.
      return entries.map(([field, message]) => ({
        kind: manualValidateErrorKey,
        message,
        fieldTree: (fieldTree as unknown as Record<string, ReadonlyFieldTree<unknown>>)[field],
      }));
    });
  }

  /** Same contract as `SubmitResult.onError`: true when handled, otherwise `<ix-form>` takes the default path. */
  handle(error: unknown): boolean {
    if (!isApiCallError(error) || !isApiErrorDetails(error.error.data)) {
      return false;
    }
    const details = error.error.data;
    if (details.errname !== ApiErrorName.Validation || !details.extra) {
      return false;
    }

    const known = Object.keys(this.value());
    const errors: Record<string, string> = {};
    const unhandled: string[] = [];
    for (const [path, message] of details.extra as [string, string][]) {
      const field = path.split('.').findLast((part) => !/^\d+$/.test(part)) ?? '';
      if (known.includes(field)) {
        errors[field] = message;
      } else {
        unhandled.push(`${field}: ${message}`);
      }
    }

    this.pinned.set({ errors: errors as PinnedErrors<T>['errors'], snapshot: this.value() });
    this.focusFirst(Object.keys(errors)[0]);
    if (unhandled.length) {
      this.errorHandler.showErrorModal(new Error(`Validation errors:\n${unhandled.join('\n')}`));
    }
    return true;
  }

  dismiss(field: string): void {
    this.pinned.update((pinned) => {
      if (!pinned) {
        return null;
      }
      const errors = { ...pinned.errors };
      delete errors[field as keyof typeof errors];
      return { ...pinned, errors };
    });
  }

  private retireOnEdit(current: T): void {
    const pinned = this.pinned();
    if (!pinned || current === pinned.snapshot) {
      return;
    }
    const keys = Object.keys(current) as (keyof T & string)[];
    const edited = keys.filter((key) => !isEqual(current[key], pinned.snapshot[key]));
    const remaining = { ...pinned.errors };
    edited.forEach((key) => delete remaining[key]);
    const editedOutsideFlagged = edited.some((key) => !(key in pinned.errors));
    this.pinned.set(editedOutsideFlagged ? null : { errors: remaining, snapshot: current });
  }

  private focusFirst(field: string | undefined): void {
    if (!field) {
      return;
    }
    setTimeout(() => {
      const element = this.document.querySelector<HTMLElement>(`[data-control-name="${field}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (element?.querySelector<HTMLElement>('input, textarea, select') ?? element)?.focus();
    });
  }
}

/**
 * The same form on signal forms, hosted by the UNCHANGED `<ix-form>`: it gets an empty `FormGroup`, so `<ix-form>`
 * keeps the submit lifecycle, loading, snackbar and panel contract while validity arrives through `extraDisabled`.
 */
@Component({
  selector: 'ix-spike-signal-form',
  template: `
    <ix-form
      [formGroup]="form"
      [extraDisabled]="fields().invalid()"
      [submitHandler]="handleSubmit"
      (closed)="closed.emit($event)"
    >
      <tn-form-field label="Name">
        <tn-input [formField]="fields.name"></tn-input>
      </tn-form-field>
      <tn-form-field label="Protocol">
        <tn-select [formField]="fields.protocol" [options]="protocols"></tn-select>
      </tn-form-field>
      @if (!fields.port().hidden()) {
        <tn-form-field label="Port">
          <tn-input [formField]="fields.port" [inputType]="InputType.Number"></tn-input>
        </tn-form-field>
      }
      <tn-checkbox label="Enabled" [formField]="fields.enabled"></tn-checkbox>
      <tn-form-list label="Aliases" (add)="addAlias()">
        @for (row of fields.aliases; track row; let i = $index) {
          <tn-form-list-item (delete)="removeAlias(i)">
            <tn-form-field label="Host">
              <tn-input [formField]="row.host"></tn-input>
            </tn-form-field>
          </tn-form-list-item>
        }
      </tn-form-list>
    </ix-form>
  `,
  imports: [
    ReactiveFormsModule, FormField, SignalFieldBridgeDirective, IxFormComponent, TnFormFieldComponent,
    TnInputComponent, TnSelectComponent, TnCheckboxComponent, TnFormListComponent, TnFormListItemComponent,
  ],
  providers: [{
    provide: signalServerErrors,
    useFactory: () => inject(SignalSpikeFormComponent).serverErrors,
  }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalSpikeFormComponent extends IxFormHostForm<boolean, SpikeFormValue> implements OnInit {
  private api = inject(SpikeApi);

  readonly isEdit = input(false);

  protected readonly InputType = InputType;
  protected readonly protocols = protocols;

  /** The shim `<ix-form>` requires. Never holds a control. */
  readonly form = new FormGroup({});

  readonly model = signal<SpikeFormValue>(defaultValue);
  readonly serverErrors = new SignalServerErrors<SpikeFormValue>(this.model);

  readonly fields = form(this.model, (path) => {
    required(path.name);
    // `{ message }` because the kind is `minLength`, which the webui resolver doesn't know (it knows `minlength`).
    minLength(path.name, 3, { message: 'The length of the field should be at least 3' });
    validateAsync(path.name, {
      params: ({ value }) => value(),
      factory: (params) => rxResource({
        params,
        stream: ({ params: name }) => this.api.isNameTaken(name),
      }),
      onSuccess: (isTaken: boolean) => (isTaken ? { kind: 'taken', message: nameTakenMessage } : null),
      onError: () => null,
    });
    hidden(path.port, { when: ({ valueOf }) => valueOf(path.protocol) !== 'https' });
    required(path.port);
    this.serverErrors.rule(path);
    applyEach(path.aliases, (row) => required(row.host));
  });

  ngOnInit(): void {
    if (this.isEdit()) {
      this.loadFormConfig(this.api.load(), (config) => this.model.set(config));
    }
  }

  override hasUnsavedChanges(): boolean {
    return this.fields().dirty();
  }

  protected addAlias(): void {
    this.model.update((value) => ({ ...value, aliases: [...value.aliases, { host: '' }] }));
    this.fields().markAsDirty();
  }

  protected removeAlias(index: number): void {
    this.model.update((value) => ({ ...value, aliases: value.aliases.filter((_, i) => i !== index) }));
    this.fields().markAsDirty();
  }

  protected readonly handleSubmit = (): SubmitResult => {
    const { port, ...rest } = this.model();
    return {
      request$: this.api.save(this.fields.port().hidden() ? rest : { ...rest, port: port as number }),
      successMessage: savedMessage,
      onError: (error) => this.serverErrors.handle(error),
    };
  };
}
