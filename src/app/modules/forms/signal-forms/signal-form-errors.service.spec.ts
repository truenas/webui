/* eslint-disable @angular-eslint/component-max-inline-declarations */
import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { form, required } from '@angular/forms/signals';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnFormFieldComponent, TnIconTesting, TnInputComponent } from '@truenas/ui-components';
import { provideTnFormFieldDismissibleErrors, provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';
import { ApiErrorName, JsonRpcErrorCode } from 'app/enums/api.enum';
import { JobExceptionType } from 'app/enums/response-error-type.enum';
import { Job } from 'app/interfaces/job.interface';
import { manualValidateErrorKey } from 'app/modules/forms/ix-forms/manual-validate-error.constants';
import { signalFormImports } from 'app/modules/forms/signal-forms/ix-signal-error-dismiss.directive';
import { SignalFormErrors } from 'app/modules/forms/signal-forms/signal-form-errors.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';

interface Model {
  name: string;
  comment: string;
  tags: string[];
  aliases: { host: string; port: number }[];
  nested: { inner: string };
}

@Component({
  selector: 'ix-signal-errors-host',
  template: `
    <tn-form-field label="Name"><tn-input [formField]="fields.name"></tn-input></tn-form-field>
    <tn-form-field label="Comment"><tn-input [formField]="fields.comment"></tn-input></tn-form-field>
    @for (row of fields.aliases; track row) {
      <tn-form-field label="Host"><tn-input [formField]="row.host"></tn-input></tn-form-field>
    }
    <tn-form-field label="Inner"><tn-input [formField]="fields.nested.inner"></tn-input></tn-form-field>
  `,
  imports: [signalFormImports, TnFormFieldComponent, TnInputComponent],
  providers: [SignalFormErrors],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly errors = inject(SignalFormErrors);
  readonly model = signal<Model>({
    name: 'a',
    comment: '',
    tags: ['one'],
    aliases: [{ host: 'h1', port: 1 }, { host: 'h2', port: 2 }],
    nested: { inner: '' },
  });

  readonly fields = form(this.model, (path) => {
    required(path.name);
    this.errors.apply(path);
  });

  constructor() {
    this.errors.connect(this.fields);
  }
}

function validationError(...extra: [string, string][]): ApiCallError {
  return new ApiCallError({
    code: JsonRpcErrorCode.CallError,
    message: 'Validation error',
    data: {
      error: 11,
      errname: ApiErrorName.Validation,
      extra: extra.map(([field, message]) => [field, message, 22]),
      trace: { class: 'ValidationErrors', formatted: '', repr: '' },
      reason: '',
    },
  } as ConstructorParameters<typeof ApiCallError>[0]);
}

describe('SignalFormErrors', () => {
  let spectator: Spectator<HostComponent>;
  let host: HostComponent;

  const createComponent = createComponentFactory({
    component: HostComponent,
    providers: [
      mockProvider(ErrorHandlerService),
      provideTnFormFieldErrors(),
      provideTnFormFieldDismissibleErrors(),
      ...TnIconTesting.jest.providers(),
    ],
  });

  const messagesOn = (field: () => { errors: () => { kind: string; message?: string }[] }): string[] => field()
    .errors()
    .filter((error) => error.kind === manualValidateErrorKey)
    .map((error) => error.message);

  beforeEach(() => {
    spectator = createComponent();
    host = spectator.component;
  });

  describe('where an error lands', () => {
    it('pins a top-level error after the method prefix', () => {
      host.errors.handleValidationErrors(validationError(['user_update.name', 'Taken.']));

      expect(messagesOn(host.fields.name)).toEqual(['Taken.']);
      expect(host.fields().invalid()).toBe(true);
      expect(host.fields.name().touched()).toBe(true);
      expect(spectator.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();
    });

    it('pins a row error on that row, not on the first row or in the modal', () => {
      host.errors.handleValidationErrors(validationError(['app_create.aliases.1.host', 'Bad host.']));

      expect(messagesOn(host.fields.aliases[1].host)).toEqual(['Bad host.']);
      expect(messagesOn(host.fields.aliases[0].host)).toEqual([]);
      expect(spectator.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();
    });

    it('pins a nested group error', () => {
      host.errors.handleValidationErrors(validationError(['config_update.nested.inner', 'Nope.']));

      expect(messagesOn(host.fields.nested.inner)).toEqual(['Nope.']);
    });

    it('falls back to the leaf name when the path does not match the model', () => {
      host.errors.handleValidationErrors(validationError(['pool_update.options.deep.comment', 'Too long.']));

      expect(messagesOn(host.fields.comment)).toEqual(['Too long.']);
    });

    it('renames a backend field with fieldsMap', () => {
      host.errors.handleValidationErrors(validationError(['user_update.full_name', 'Required.']), {
        full_name: 'name',
      });

      expect(messagesOn(host.fields.name)).toEqual(['Required.']);
    });

    it('sends an error on a field that is not on screen to the modal', () => {
      host.errors.handleValidationErrors(validationError(
        ['app_create.name', 'Taken.'],
        ['app_create.aliases.0.port', 'Bad port.'],
        ['app_create.tags.0', 'Bad tag.'],
        ['app_create.mystery', 'Who?'],
      ));

      expect(messagesOn(host.fields.name)).toEqual(['Taken.']);
      // The port of a row is not rendered, so the error climbs to the row, then the list, and finds nothing on
      // screen; the same goes for a tag. Neither is pinned where nobody can read it.
      expect(host.fields.aliases().errorSummary()).toEqual([]);
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(new Error(
        'Validation errors:\napp_create.aliases.0.port: Bad port.\napp_create.tags.0: Bad tag.\napp_create.mystery: Who?',
      ));
    });

    it('pins a failed job\'s validation errors', () => {
      const job = {
        exc_info: { type: JobExceptionType.Validation, extra: [['pool_create.name', 'Taken.']] },
      } as unknown as Job;
      host.errors.handleValidationErrors(new FailedJobError(job));

      expect(messagesOn(host.fields.name)).toEqual(['Taken.']);
    });

    it('sends anything that is not a validation error to the modal unchanged', () => {
      const error = new Error('Socket closed');
      host.errors.handleValidationErrors(error);

      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(error);
      expect(host.fields().invalid()).toBe(false);
    });
  });

  describe('retiring verdicts', () => {
    beforeEach(() => {
      host.errors.handleValidationErrors(validationError(
        ['app_create.name', 'Taken.'],
        ['app_create.aliases.0.host', 'Bad host.'],
      ));
    });

    it('pins both, which blocks the form', () => {
      expect(host.fields().invalid()).toBe(true);
    });

    it('editing a flagged field drops only its own verdict', () => {
      host.fields.name().value.set('b');
      spectator.detectChanges();

      expect(messagesOn(host.fields.name)).toEqual([]);
      expect(messagesOn(host.fields.aliases[0].host)).toEqual(['Bad host.']);
      expect(host.fields().invalid()).toBe(true);
    });

    it('editing any other field drops every verdict, so a Force-style answer never leaves Save stuck', () => {
      host.fields.comment().value.set('changed');
      spectator.detectChanges();

      expect(host.fields().invalid()).toBe(false);
    });

    it('dismissing the message under a field drops its verdict', () => {
      spectator.detectChanges();
      spectator.click(spectator.query('.tn-form-field-error-dismiss button'));

      expect(messagesOn(host.fields.name)).toEqual([]);
      expect(messagesOn(host.fields.aliases[0].host)).toEqual(['Bad host.']);
    });

    it('clear() drops them all', () => {
      host.errors.clear();
      expect(host.fields().invalid()).toBe(false);
    });
  });
});
