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

const formGroup = new FormGroup({
  test_control_1: new FormControl(''),
});

describe('FormErrorHandlerService', () => {
  let spectator: SpectatorService<FormErrorHandlerService>;

  const createService = createServiceFactory({
    service: FormErrorHandlerService,
    providers: [
      mockProvider(DialogService),
      mockProvider(ErrorHandlerService),
      mockProvider(ErrorParserService, {
        parseError: jest.fn((error: ApiErrorDetails) => ({
          title: 'Error',
          message: error.reason,
          backtrace: error.trace?.formatted,
        } as ErrorReport)),
      }),
      mockProvider(IxFormService, {
        getControlNames: jest.fn(() => Object.keys(formGroup.controls)),
      }),
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();
    spectator = createService();
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

    it('shows error dialog with original error when control is not found', () => {
      spectator.service.handleValidationErrors(callError, formGroup);

      expect(console.error).not.toHaveBeenCalledWith('Could not find control test_control_1.');
      expect(console.error).toHaveBeenCalledWith('Could not find control test_control_2.');
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(callError);
    });

    it('scrolls element with an error into view', fakeAsync(() => {
      const elementMock = {
        scrollIntoView: jest.fn(),
        focus: jest.fn(),
      } as unknown as HTMLElement;
      jest.spyOn(spectator.inject(IxFormService), 'getElementByControlName').mockReturnValue(elementMock);

      spectator.service.handleValidationErrors(callError, formGroup);

      tick();

      expect(elementMock.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'center' }));
      expect(elementMock.focus).toHaveBeenCalled();
    }));
  });
});
