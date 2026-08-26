import { DOCUMENT } from '@angular/common';
import { fakeAsync, tick } from '@angular/core/testing';
import { Validators } from '@angular/forms';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { ApiErrorName, JsonRpcErrorCode } from 'app/enums/api.enum';
import { JobState } from 'app/enums/job-state.enum';
import { JobExceptionType } from 'app/enums/response-error-type.enum';
import { ApiErrorDetails, ApiTraceFrame } from 'app/interfaces/api-error.interface';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { ValidationErrorCommunicationService } from 'app/modules/forms/validation-error-communication.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ErrorParserService } from 'app/services/errors/error-parser.service';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';

const callError = new ApiCallError({
  code: JsonRpcErrorCode.CallError,
  message: 'Validation error',
  data: {
    error: 11,
    errname: ApiErrorName.Validation,
    extra: [
      [
        'test-query.test_control_1',
        'Error string for control 1',
        22,
      ],
      [
        'test-query.test_control_2',
        'Error string for control 2',
        22,
      ],
    ],
    trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
    reason: 'Test reason',
  },
});

const arrayFieldError = new ApiCallError({
  code: JsonRpcErrorCode.CallError,
  message: 'Validation error',
  data: {
    error: 11,
    errname: ApiErrorName.Validation,
    extra: [
      [
        'user_update.sudo_commands_no_passwd.0',
        'Command not allowed',
        22,
      ],
    ],
    trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
    reason: 'Test reason',
  },
});

const unreachableAddressError = new ApiCallError({
  code: JsonRpcErrorCode.CallError,
  message: 'Validation error',
  data: {
    error: 11,
    errname: ApiErrorName.Validation,
    extra: [
      [
        'ntp_server_create.address',
        'Server could not be reached. Check "Force" to continue regardless.',
        22,
      ],
    ],
    trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
    reason: 'Test reason',
  },
});

const formGroup = new FormGroup({
  test_control_1: new FormControl(''),
  sudo_commands_no_passwd: new FormControl([]),
});

describe('FormErrorHandlerService', () => {
  let spectator: SpectatorService<FormErrorHandlerService>;
  const documentMock = {
    body: {
      contains: jest.fn(() => true) as HTMLElement['contains'],
    } as HTMLElement,
    getElementById: jest.fn(),
    querySelector: jest.fn(),
  } as unknown as Document;

  const elementMock = {
    scrollIntoView: jest.fn() as HTMLElement['scrollIntoView'],
    focus: jest.fn() as HTMLElement['focus'],
    // The service looks for a native control inside the element first; an ix-* host wraps none.
    querySelector: jest.fn((): HTMLElement | null => null) as unknown as HTMLElement['querySelector'],
  } as HTMLElement;

  const createService = createServiceFactory({
    service: FormErrorHandlerService,
    providers: [
      mockProvider(DialogService),
      mockProvider(ErrorHandlerService),
      mockProvider(ErrorParserService, {
        parseError: jest.fn((error: ApiErrorDetails) => ({
          title: 'Error',
          message: error.reason,
          stackTrace: error.trace?.formatted,
        } as ErrorReport)),
      }),
      mockProvider(IxFormService, {
        getControlNames: jest.fn(() => Object.keys(formGroup.controls)),
        getElementByControlName: jest.fn(() => elementMock),
      }),
      mockProvider(ValidationErrorCommunicationService, {
        notifyValidationError: jest.fn(),
      }),
      {
        provide: DOCUMENT,
        useValue: documentMock,
      },
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    spectator = createService();

    // Reset mocks to their default behavior
    jest.spyOn(spectator.inject(IxFormService), 'getElementByControlName').mockReturnValue(elementMock);
  });

  describe('handleValidationErrors', () => {
    it('sets errors for controls for a call validation error', () => {
      jest.spyOn(formGroup.controls.test_control_1, 'setErrors').mockImplementation();
      jest.spyOn(formGroup.controls.test_control_1, 'markAsTouched').mockImplementation();

      spectator.service.handleValidationErrors(callError, formGroup);

      expect(formGroup.controls.test_control_1.setErrors).toHaveBeenCalledWith({
        ixManualValidateError: {
          message: 'Error string for control 1',
        },
        manualValidateError: true,
        manualValidateErrorMsg: 'Error string for control 1',
      });
      expect(formGroup.controls.test_control_1.markAsTouched).toHaveBeenCalled();
    });

    it('sets errors for a job failed with validation errors', () => {
      jest.spyOn(formGroup.controls.test_control_1, 'setErrors').mockImplementation();
      jest.spyOn(formGroup.controls.test_control_1, 'markAsTouched').mockImplementation();

      const failedJob = new FailedJobError({
        state: JobState.Failed,
        error: '[EINVAL] Value error, Not a valid integer',
        exception: '',
        exc_info: {
          type: JobExceptionType.Validation,
          extra: [
            [
              'test-query.test_control_1',
              'Value error, Not a valid integer',
              22,
            ],
          ],
        },
      } as Job);
      spectator.service.handleValidationErrors(failedJob, formGroup);

      expect(formGroup.controls.test_control_1.setErrors).toHaveBeenCalledWith({
        ixManualValidateError: {
          message: 'Value error, Not a valid integer',
        },
        manualValidateError: true,
        manualValidateErrorMsg: 'Value error, Not a valid integer',
      });
      expect(formGroup.controls.test_control_1.markAsTouched).toHaveBeenCalled();
    });

    it('shows modal fallback when control is not found', () => {
      spectator.service.handleValidationErrors(callError, formGroup);

      expect(console.warn).not.toHaveBeenCalledWith('Could not find control test_control_1.');
      expect(console.warn).toHaveBeenCalledWith('Could not find control test_control_2.');

      // Expect the modal to be called with a custom error containing only unhandled errors
      const mockErrorHandler = spectator.inject(ErrorHandlerService);
      expect(mockErrorHandler.showErrorModal).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Validation errors:\ntest_control_2: Error string for control 2'),
        }),
      );
    });

    it('scrolls element with an error into view', fakeAsync(() => {
      spectator.service.handleValidationErrors(callError, formGroup);

      tick();

      expect(elementMock.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'center' }));
      expect(elementMock.focus).toHaveBeenCalled();
    }));

    it('focuses the native control inside a tn-* component host', fakeAsync(() => {
      // `data-control-name` sits on the tn-* component host, which carries no tabindex and so
      // ignores focus() — the focusable element is the native control it wraps.
      const innerInput = { focus: jest.fn() } as unknown as HTMLElement;
      // `Once`: jest is configured to clear calls between tests, not implementations.
      (elementMock.querySelector as jest.Mock).mockReturnValueOnce(innerInput);

      spectator.service.handleValidationErrors(callError, formGroup);
      tick();

      expect(elementMock.scrollIntoView).toHaveBeenCalled();
      expect(innerInput.focus).toHaveBeenCalled();
      expect(elementMock.focus).not.toHaveBeenCalled();
    }));

    it('notifies EditableComponents through secure service', () => {
      spectator.service.handleValidationErrors(callError, formGroup);

      expect(spectator.inject(ValidationErrorCommunicationService).notifyValidationError)
        .toHaveBeenCalledWith('test_control_1');
    });


    it('handles array field names properly', () => {
      jest.spyOn(formGroup.controls.sudo_commands_no_passwd, 'setErrors').mockImplementation();
      jest.spyOn(formGroup.controls.sudo_commands_no_passwd, 'markAsTouched').mockImplementation();

      spectator.service.handleValidationErrors(arrayFieldError, formGroup);

      expect(formGroup.controls.sudo_commands_no_passwd.setErrors).toHaveBeenCalledWith({
        ixManualValidateError: {
          message: 'Command not allowed',
        },
        manualValidateError: true,
        manualValidateErrorMsg: 'Command not allowed',
      });
    });
  });

  describe('self-retiring pinned errors', () => {
    // NAS-142225. A backend verdict is pinned with `setErrors()` and never re-evaluates, so an
    // error the user is meant to answer from a DIFFERENT field would hold Save shut forever.
    const buildNtpForm = (): FormGroup<{ address: string; force: boolean }> => new FormGroup({
      address: new FormControl('192.0.2.1', [Validators.required]),
      force: new FormControl(false),
    });

    it('retires the pinned error on the next edit anywhere in the form', () => {
      const form = buildNtpForm();
      spectator.service.handleValidationErrors(unreachableAddressError, form);
      expect(form.controls.address.errors).toEqual(expect.objectContaining({ manualValidateError: true }));
      expect(form.valid).toBe(false);

      form.controls.force.setValue(true);

      expect(form.controls.address.errors).toBeNull();
      expect(form.valid).toBe(true);
    });

    it('restores the real validation state instead of blanket-clearing errors', () => {
      const form = buildNtpForm();
      form.controls.address.setValue('');
      spectator.service.handleValidationErrors(unreachableAddressError, form);

      form.controls.force.setValue(true);

      // The pinned verdict was masking a genuinely empty required field, which must say so again.
      expect(form.controls.address.errors).toEqual({ required: true });
      expect(form.valid).toBe(false);
    });

    it('leaves a live client-side error on a sibling alone', () => {
      const form = new FormGroup({
        address: new FormControl('192.0.2.1', [Validators.required]),
        force: new FormControl(false),
        maxpoll: new FormControl(99, [Validators.max(17)]),
      });
      spectator.service.handleValidationErrors(unreachableAddressError, form);

      form.controls.force.setValue(true);

      expect(form.controls.address.errors).toBeNull();
      expect(form.controls.maxpoll.errors).toEqual(expect.objectContaining({ max: expect.anything() }));
      expect(form.valid).toBe(false);
    });

    it('retires an error pinned on a nested control from an edit in a sibling group', () => {
      // The subscription listens on the control's root rather than its parent, so an edit anywhere
      // in the form counts — including a group the flagged control does not itself live in.
      const server = new FormGroup({ address: new FormControl('192.0.2.1') });
      const options = new FormGroup({ force: new FormControl(false) });
      // Both groups belong to one form, so `root` is the shared parent; they are handed over
      // separately because the leaf lookup resolves against each group it is given.
      const form = new FormGroup({ server, options });
      expect(server.controls.address.root).toBe(form);

      spectator.service.handleValidationErrors(unreachableAddressError, [server, options]);
      expect(server.controls.address.errors).toEqual(expect.objectContaining({ manualValidateError: true }));

      options.controls.force.setValue(true);

      expect(server.controls.address.errors).toBeNull();
    });

    // A verdict can flag several fields at once. Answering one must not wipe the messages for the
    // ones the user has not reached yet — those verdicts still stand.
    const twoFieldError = new ApiCallError({
      code: JsonRpcErrorCode.CallError,
      message: 'Validation error',
      data: {
        error: 11,
        errname: ApiErrorName.Validation,
        extra: [
          ['ntp_server_create.address', 'Server could not be reached.', 22],
          ['ntp_server_create.description', 'Description is already taken.', 22],
        ],
        trace: { class: 'ValidationErrors', formatted: '', frames: [] as ApiTraceFrame[] },
        reason: 'Test reason',
      },
    });

    const buildTwoFieldForm = (): FormGroup<{ address: string; description: string; force: boolean }> => new FormGroup({
      address: new FormControl('192.0.2.1'),
      description: new FormControl('Primary'),
      force: new FormControl(false),
    });

    it('keeps the other fields of a multi-field verdict pinned while one of them is answered', () => {
      const form = buildTwoFieldForm();
      spectator.service.handleValidationErrors(twoFieldError, form);
      expect(form.controls.address.errors).toEqual(expect.objectContaining({ manualValidateError: true }));
      expect(form.controls.description.errors).toEqual(expect.objectContaining({ manualValidateError: true }));

      form.controls.address.setValue('192.0.2.2');

      expect(form.controls.address.errors).toBeNull();
      expect(form.controls.description.errors).toEqual(expect.objectContaining({ manualValidateError: true }));
      expect(form.valid).toBe(false);
    });

    it('retires the still-pinned fields once the edit lands outside the flagged set', () => {
      const form = buildTwoFieldForm();
      spectator.service.handleValidationErrors(twoFieldError, form);
      form.controls.address.setValue('192.0.2.2');

      form.controls.force.setValue(true);

      expect(form.controls.description.errors).toBeNull();
      expect(form.valid).toBe(true);
    });

    it('re-pins the verdict when the next save is rejected again', () => {
      const form = buildNtpForm();
      spectator.service.handleValidationErrors(unreachableAddressError, form);
      form.controls.force.setValue(true);
      expect(form.controls.address.errors).toBeNull();

      spectator.service.handleValidationErrors(unreachableAddressError, form);

      expect(form.controls.address.errors).toEqual(expect.objectContaining({ manualValidateError: true }));
    });
  });

  describe('clearValidationErrorsForHiddenFields', () => {
    it('clears errors for hidden fields when provided as array', () => {
      const control1 = new FormControl('');
      const control2 = new FormControl('');
      const testForm = new FormGroup({
        field1: control1,
        field2: control2,
      });

      // Set initial errors
      control1.setErrors({ required: true });
      control2.setErrors({ required: true });

      spectator.service.clearValidationErrorsForHiddenFields(testForm, ['field1']);

      expect(control1.errors).toBeNull();
      expect(control2.errors).toEqual({ required: true });
    });

    it('clears errors for hidden fields when provided as single form group', () => {
      const control = new FormControl('');
      const testForm = new FormGroup({
        hiddenField: control,
      });

      control.setErrors({ required: true });

      spectator.service.clearValidationErrorsForHiddenFields(testForm, ['hiddenField']);

      expect(control.errors).toBeNull();
    });

    it('handles nested field paths', () => {
      const nestedControl = new FormControl('');
      const nestedGroup = new FormGroup({
        nested: nestedControl,
      });
      const testForm = new FormGroup({
        section: nestedGroup,
      });

      nestedControl.setErrors({ required: true });

      spectator.service.clearValidationErrorsForHiddenFields(testForm, ['section.nested']);

      expect(nestedControl.errors).toBeNull();
    });

    it('does nothing when hiddenFieldNames is empty', () => {
      const control = new FormControl('');
      const testForm = new FormGroup({
        field: control,
      });

      control.setErrors({ required: true });

      spectator.service.clearValidationErrorsForHiddenFields(testForm, []);

      expect(control.errors).toEqual({ required: true });
    });

    it('does nothing when hiddenFieldNames is null', () => {
      const control = new FormControl('');
      const testForm = new FormGroup({
        field: control,
      });

      control.setErrors({ required: true });

      spectator.service.clearValidationErrorsForHiddenFields(testForm, null as unknown as string[]);

      expect(control.errors).toEqual({ required: true });
    });

    it('removes fields from unhandled errors list', () => {
      const testForm = new FormGroup({
        field1: new FormControl(''),
      });

      // First create some unhandled errors
      const errorWithMissingControl = new ApiCallError({
        code: JsonRpcErrorCode.CallError,
        message: 'Validation error',
        data: {
          error: 11,
          errname: ApiErrorName.Validation,
          extra: [
            ['test.missing_field', 'Error message', 22],
          ],
          trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
          reason: 'Test reason',
        },
      });

      // This should add to unhandled errors
      spectator.service.handleValidationErrors(errorWithMissingControl, testForm);

      // Now clear the field - should remove from unhandled errors
      spectator.service.clearValidationErrorsForHiddenFields(testForm, ['missing_field']);

      // Verify no modal is shown when checking fallback errors since the error was removed
      const mockErrorHandler = spectator.inject(ErrorHandlerService);
      jest.clearAllMocks();

      // Process another error to trigger checkForFallbackErrors
      spectator.service.handleValidationErrors(callError, formGroup);

      // The previous unhandled error should not appear in the modal
      expect(mockErrorHandler.showErrorModal).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.not.stringContaining('missing_field'),
        }),
      );
    });
  });

  describe('triggerAnchor functionality', () => {
    it('clicks anchor element when found', () => {
      const mockElement = {
        click: jest.fn(),
      } as unknown as HTMLElement;

      jest.spyOn(spectator.inject(DOCUMENT), 'getElementById').mockReturnValue(mockElement);

      spectator.service.handleValidationErrors(callError, formGroup, {}, 'test-anchor');

      expect(spectator.inject(DOCUMENT).getElementById).toHaveBeenCalledWith('test-anchor');
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('handles missing triggerAnchor element gracefully', () => {
      jest.spyOn(spectator.inject(DOCUMENT), 'getElementById').mockReturnValue(null);

      expect(() => {
        spectator.service.handleValidationErrors(callError, formGroup, {}, 'missing-anchor');
      }).not.toThrow();
    });
  });

  describe('DOM element fallback handling', () => {
    /**
     * These tests verify the service's querySelector fallback behavior.
     * Note: querySelector is flagged as deprecated by SonarJS, but it's necessary here because:
     * 1. The service being tested uses querySelector as a fallback mechanism when IxFormService fails
     * 2. We're testing error handling paths that require mocking DOM queries
     * 3. There's no modern alternative for testing Document.querySelector behavior in Jest
     */
    it('uses querySelector as fallback when IxFormService returns null', () => {
      const mockFormService = spectator.inject(IxFormService);
      jest.spyOn(mockFormService, 'getElementByControlName').mockReturnValue(null);

      const mockElement = document.createElement('input');
      const doc = spectator.inject(DOCUMENT);
      jest.spyOn(doc, 'querySelector').mockReturnValue(mockElement);

      spectator.service.handleValidationErrors(callError, formGroup);

      // Also matches `data-control-name`: tn-* controls built by `<ix-form-renderer>` register with
      // neither IxFormService nor a `formControlName` attribute (it is a property binding).
      // eslint-disable-next-line sonarjs/deprecation
      expect(doc.querySelector)
        .toHaveBeenCalledWith('[formControlName="test_control_1"], [data-control-name="test_control_1"]');
    });

    it('warns when DOM element cannot be found', () => {
      const mockFormService = spectator.inject(IxFormService);
      jest.spyOn(mockFormService, 'getElementByControlName').mockReturnValue(null);
      jest.spyOn(spectator.inject(DOCUMENT), 'querySelector').mockReturnValue(null);

      spectator.service.handleValidationErrors(callError, formGroup);

      expect(console.warn).toHaveBeenCalledWith('Could not find DOM element for field test_control_1.');
    });

    it('shows a rendered tn-* control inline only, without duplicating it in an error modal', () => {
      // NAS-142225: a tn-* form built by `<ix-form-renderer>` registers with neither IxFormService
      // nor a `formControlName` attribute, so its controls used to look unrendered and every
      // message the user could already read under the field was repeated in a modal. They are found
      // through `data-control-name` now, which keeps the report inline.
      jest.spyOn(spectator.inject(IxFormService), 'getElementByControlName').mockReturnValue(null);
      jest.spyOn(spectator.inject(DOCUMENT), 'querySelector').mockReturnValue(document.createElement('input'));
      const ntpForm = new FormGroup({ address: new FormControl('192.0.2.1') });

      // The ErrorHandlerService mock is built once per factory, so call counts carry over
      // between tests in this file — clear them to assert on this call alone.
      const mockErrorHandler = spectator.inject(ErrorHandlerService);
      jest.clearAllMocks();

      spectator.service.handleValidationErrors(unreachableAddressError, ntpForm);

      expect(ntpForm.controls.address.errors).toEqual(expect.objectContaining({
        manualValidateError: true,
        manualValidateErrorMsg: 'Server could not be reached. Check "Force" to continue regardless.',
      }));
      expect(mockErrorHandler.showErrorModal).not.toHaveBeenCalled();
    });

    it('still escalates to a modal for a control that is nowhere in the DOM', () => {
      // A control in the form group but not rendered (behind an `@if`, or payload-only) has nowhere
      // to show its pinned message, so the modal is the only signal the user gets.
      jest.spyOn(spectator.inject(IxFormService), 'getElementByControlName').mockReturnValue(null);
      jest.spyOn(spectator.inject(DOCUMENT), 'querySelector').mockReturnValue(null);
      const ntpForm = new FormGroup({ address: new FormControl('192.0.2.1') });

      const mockErrorHandler = spectator.inject(ErrorHandlerService);
      jest.clearAllMocks();

      spectator.service.handleValidationErrors(unreachableAddressError, ntpForm);

      expect(mockErrorHandler.showErrorModal).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            'address: Server could not be reached. Check "Force" to continue regardless.',
          ),
        }),
      );
    });
  });

  describe('field path extraction edge cases', () => {
    it('handles complex nested field paths correctly', () => {
      const complexError = new ApiCallError({
        code: JsonRpcErrorCode.CallError,
        message: 'Validation error',
        data: {
          error: 11,
          errname: ApiErrorName.Validation,
          extra: [
            ['user_update.nested.deep.field_name', 'Deep field error', 22],
            ['config.array.0.item', 'Array item error', 22],
            ['simple_field', 'Simple field error', 22],
          ],
          trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
          reason: 'Test reason',
        },
      });

      const complexForm = new FormGroup({
        field_name: new FormControl(''),
        item: new FormControl(''),
        simple_field: new FormControl(''),
      });

      jest.spyOn(complexForm.controls.field_name, 'setErrors').mockImplementation();
      jest.spyOn(complexForm.controls.item, 'setErrors').mockImplementation();
      jest.spyOn(complexForm.controls.simple_field, 'setErrors').mockImplementation();

      spectator.service.handleValidationErrors(complexError, complexForm);

      expect(complexForm.controls.field_name.setErrors).toHaveBeenCalledWith({
        ixManualValidateError: { message: 'Deep field error' },
        manualValidateError: true,
        manualValidateErrorMsg: 'Deep field error',
      });
      expect(complexForm.controls.item.setErrors).toHaveBeenCalledWith({
        ixManualValidateError: { message: 'Array item error' },
        manualValidateError: true,
        manualValidateErrorMsg: 'Array item error',
      });
      expect(complexForm.controls.simple_field.setErrors).toHaveBeenCalledWith({
        ixManualValidateError: { message: 'Simple field error' },
        manualValidateError: true,
        manualValidateErrorMsg: 'Simple field error',
      });
    });

    it('handles empty or invalid field paths', () => {
      // Test path that extracts to a valid field name but can't find the control
      const pathError = new ApiCallError({
        code: JsonRpcErrorCode.CallError,
        message: 'Validation error',
        data: {
          error: 11,
          errname: ApiErrorName.Validation,
          extra: [
            ['test.nonexistent_field', 'Error for nonexistent field', 22],
          ],
          trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
          reason: 'Test reason',
        },
      });

      spectator.service.handleValidationErrors(pathError, formGroup);

      // The field extraction succeeds (extracts "nonexistent_field") but control lookup fails
      expect(console.warn).toHaveBeenCalledWith('Could not find control nonexistent_field.');
    });

    it('warns when field extraction fails', () => {
      // Create a spy to mock extractFieldName returning empty string
      jest.spyOn(spectator.service as unknown as { extractFieldName: (path: string) => string }, 'extractFieldName').mockReturnValue('');

      const validError = new ApiCallError({
        code: JsonRpcErrorCode.CallError,
        message: 'Validation error',
        data: {
          error: 11,
          errname: ApiErrorName.Validation,
          extra: [
            ['some.valid.path', 'Valid error message', 22],
          ],
          trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
          reason: 'Test reason',
        },
      });

      spectator.service.handleValidationErrors(validError, formGroup);

      // Should warn about failed field extraction with the original path
      expect(console.warn).toHaveBeenCalledWith('Failed to extract field name from path: some.valid.path');
    });
  });

  describe('non-validation errors', () => {
    it('falls back to error modal for non-validation API errors', () => {
      const nonValidationError = new ApiCallError({
        code: JsonRpcErrorCode.CallError,
        message: 'Some other error',
        data: {
          error: 22,
          errname: 'OTHER_ERROR' as ApiErrorName,
          trace: { class: 'SomeError', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
          reason: 'Not a validation error',
          extra: undefined,
        },
      });

      spectator.service.handleValidationErrors(nonValidationError, formGroup);

      const mockErrorHandler = spectator.inject(ErrorHandlerService);
      expect(mockErrorHandler.showErrorModal).toHaveBeenCalledWith(nonValidationError);
    });

    it('falls back to error modal for non-validation job errors', () => {
      const nonValidationJobError = new FailedJobError({
        id: 1,
        method: 'app.create',
        arguments: [],
        state: JobState.Failed,
        error: '[EPERM] Permission denied',
        exception: '',
        abortable: false,
        transient: false,
        description: 'Test job',
        time_started: { $date: Date.now() },
        time_finished: { $date: Date.now() },
        progress: { percent: 0, description: '', extra: '' },
        result: null,
        logs_path: '',
        logs_excerpt: '',
        credentials: null,
        removed: false,
        message_ids: [],
        exc_info: {
          type: 'PERMISSION_ERROR' as JobExceptionType,
          extra: {},
        },
      });

      spectator.service.handleValidationErrors(nonValidationJobError, formGroup);

      const mockErrorHandler = spectator.inject(ErrorHandlerService);
      expect(mockErrorHandler.showErrorModal).toHaveBeenCalledWith(nonValidationJobError);
    });

    it('handles malformed error data gracefully', () => {
      // Create a spy to mock the type guard returning false
      jest.spyOn(spectator.service as unknown as { isApiErrorDetailsWithExtra: () => boolean }, 'isApiErrorDetailsWithExtra').mockReturnValue(false);

      const validError = new ApiCallError({
        code: JsonRpcErrorCode.CallError,
        message: 'Validation error',
        data: {
          error: 11,
          errname: ApiErrorName.Validation,
          extra: [
            ['valid.field', 'Valid message', 22],
          ],
          trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
          reason: 'Test reason',
        },
      });

      spectator.service.handleValidationErrors(validError, formGroup);

      // Should warn about invalid structure
      expect(console.warn).toHaveBeenCalledWith(
        'Error does not contain expected extra field structure:',
        expect.any(Object),
      );

      // When type guard fails in handleValidationError, it returns early
      // The error modal is not called because the main method already delegated to handleValidationError
      // This test verifies that malformed data is handled gracefully without throwing
    });
  });

  describe('array control handling', () => {
    it('handles validation errors for form arrays', () => {
      // Create a simple test that doesn't require complex FormArray mocking
      const arrayFormGroup = new FormGroup({
        test_array: new FormControl([]),
      });

      const arrayError = new ApiCallError({
        code: JsonRpcErrorCode.CallError,
        message: 'Validation error',
        data: {
          error: 11,
          errname: ApiErrorName.Validation,
          extra: [
            ['test.test_array', 'Array validation error', 22],
          ],
          trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
          reason: 'Test reason',
        },
      });

      jest.spyOn(arrayFormGroup.controls.test_array, 'setErrors').mockImplementation();
      jest.spyOn(arrayFormGroup.controls.test_array, 'markAsTouched').mockImplementation();

      spectator.service.handleValidationErrors(arrayError, arrayFormGroup);

      expect(arrayFormGroup.controls.test_array.setErrors).toHaveBeenCalledWith({
        ixManualValidateError: { message: 'Array validation error' },
        manualValidateError: true,
        manualValidateErrorMsg: 'Array validation error',
      });
    });
  });
});
