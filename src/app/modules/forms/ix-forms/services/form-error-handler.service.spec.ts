import { DOCUMENT } from '@angular/common';
import { fakeAsync, tick } from '@angular/core/testing';
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
        'user_update.sudo_commands_nopassword.0',
        'Command not allowed',
        22,
      ],
    ],
    trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] as ApiTraceFrame[] },
    reason: 'Test reason',
  },
});

const formGroup = new FormGroup({
  test_control_1: new FormControl(''),
  sudo_commands_nopassword: new FormControl([]),
});

describe('FormErrorHandlerService', () => {
  let spectator: SpectatorService<FormErrorHandlerService>;
  const documentMock = {
    body: {
      contains: jest.fn(() => true) as HTMLElement['contains'],
    } as HTMLElement,
  } as Document;

  const elementMock = {
    scrollIntoView: jest.fn() as HTMLElement['scrollIntoView'],
    focus: jest.fn() as HTMLElement['focus'],
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

    it('notifies EditableComponents through secure service', () => {
      spectator.service.handleValidationErrors(callError, formGroup);

      expect(spectator.inject(ValidationErrorCommunicationService).notifyValidationError)
        .toHaveBeenCalledWith('test_control_1');
    });


    it('handles array field names properly', () => {
      jest.spyOn(formGroup.controls.sudo_commands_nopassword, 'setErrors').mockImplementation();
      jest.spyOn(formGroup.controls.sudo_commands_nopassword, 'markAsTouched').mockImplementation();

      spectator.service.handleValidationErrors(arrayFieldError, formGroup);

      expect(formGroup.controls.sudo_commands_nopassword.setErrors).toHaveBeenCalledWith({
        ixManualValidateError: {
          message: 'Command not allowed',
        },
        manualValidateError: true,
        manualValidateErrorMsg: 'Command not allowed',
      });
    });
  });
});
