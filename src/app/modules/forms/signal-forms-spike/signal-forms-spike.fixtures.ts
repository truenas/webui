/* eslint-disable max-classes-per-file, @angular-eslint/component-max-inline-declarations --
   The two implementations sit side by side so they can be read against each other. */
/* eslint-disable angular-file-naming/component-filename-suffix */
/* eslint-disable angular-file-naming/service-filename-suffix */
import {
  ChangeDetectionStrategy, Component, inject, Injectable, input, OnInit, signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';
import {
  applyEach, form, hidden, minLength, required, validateAsync,
} from '@angular/forms/signals';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormListComponent, TnFormListItemComponent, TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import {
  map, Observable, of, startWith,
} from 'rxjs';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { signalFormImports } from 'app/modules/forms/signal-forms/ix-signal-error-dismiss.directive';
import { SignalFormErrors } from 'app/modules/forms/signal-forms/signal-form-errors.service';
import { activeValue } from 'app/modules/forms/signal-forms/signal-forms.utils';
import { TranslatedString } from 'app/modules/translate/translate.helper';

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

/**
 * The same form on signal forms, on the NAS-145112 infrastructure: `<ix-form [fieldTree]>` owns the submit
 * lifecycle, loading, snackbar and panel contract, `SignalFormErrors` pins API errors, and the payload comes
 * from `activeValue()`, which leaves the hidden port out. No bridge and no empty `FormGroup`: 0.8.24 made
 * `tn-form-field` read the field itself.
 */
@Component({
  selector: 'ix-spike-signal-form',
  template: `
    <ix-form [fieldTree]="form" [submitHandler]="handleSubmit" (closed)="closed.emit($event)">
      <tn-form-field label="Name">
        <tn-input [formField]="form.name"></tn-input>
      </tn-form-field>
      <tn-form-field label="Protocol">
        <tn-select [formField]="form.protocol" [options]="protocols"></tn-select>
      </tn-form-field>
      @if (!form.port().hidden()) {
        <tn-form-field label="Port">
          <tn-input [formField]="form.port" [inputType]="InputType.Number"></tn-input>
        </tn-form-field>
      }
      <tn-checkbox label="Enabled" [formField]="form.enabled"></tn-checkbox>
      <tn-form-list label="Aliases" (add)="addAlias()">
        @for (row of form.aliases; track row; let i = $index) {
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
    signalFormImports, IxFormComponent, TnFormFieldComponent, TnInputComponent, TnSelectComponent,
    TnCheckboxComponent, TnFormListComponent, TnFormListItemComponent,
  ],
  providers: [SignalFormErrors],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalSpikeFormComponent extends IxFormHostForm<boolean, SpikeFormValue> implements OnInit {
  private api = inject(SpikeApi);
  private serverErrors = inject(SignalFormErrors);

  readonly isEdit = input(false);

  protected readonly InputType = InputType;
  protected readonly protocols = protocols;

  readonly model = signal<SpikeFormValue>(defaultValue);

  readonly form = form(this.model, (path) => {
    required(path.name);
    minLength(path.name, 3);
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
    applyEach(path.aliases, (row) => required(row.host));
    this.serverErrors.apply(path);
  });

  ngOnInit(): void {
    if (this.isEdit()) {
      this.loadFormConfig(this.api.load(), (config) => this.model.set(config));
    }
  }

  protected addAlias(): void {
    this.model.update((value) => ({ ...value, aliases: [...value.aliases, { host: '' }] }));
    this.form().markAsDirty();
  }

  protected removeAlias(index: number): void {
    this.model.update((value) => ({ ...value, aliases: value.aliases.filter((_, i) => i !== index) }));
    this.form().markAsDirty();
  }

  protected readonly handleSubmit = (): SubmitResult => ({
    request$: this.api.save(activeValue(this.form) as SpikePayload),
    successMessage: savedMessage,
  });
}
