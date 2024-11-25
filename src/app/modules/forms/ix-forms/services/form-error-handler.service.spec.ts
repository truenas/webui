import { fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { ApiErrorName } from 'app/enums/api-error-name.enum';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { ApiError } from 'app/interfaces/api-error.interface';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

const fakeError: ApiError = {
  type: ResponseErrorType.Validation,
  error: 11,
  errname: ApiErrorName.Again,
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
  trace: { class: 'ValidationErrors', formatted: 'Formatted string', frames: [] },
  reason: 'Test reason',
};

const formGroup = new FormGroup({
  test_control_1: new FormControl(''),
});

describe('FormErrorHandlerService', () => {
  let spectator: SpectatorService<FormErrorHandlerService>;

  const createService = createServiceFactory({
    service: FormErrorHandlerService,
    providers: [
      mockProvider(DialogService),
      mockProvider(ErrorHandlerService, {
        isWebSocketError: jest.fn(() => true),
        parseError: jest.fn((error: ApiError) => ({
          title: error.type,
          message: error.reason,
          backtrace: error.trace?.formatted,
        } as ErrorReport)),
      }),
      mockProvider(IxFormService, {
        getControlsNames: jest.fn(() => Object.keys(formGroup.controls)),
      }),
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();
    spectator = createService();
  });

  describe('handleValidationErrors', () => {
    it('sets errors for controls', () => {
      jest.spyOn(formGroup.controls.test_control_1, 'setErrors').mockImplementation();
      jest.spyOn(formGroup.controls.test_control_1, 'markAsTouched').mockImplementation();

      spectator.service.handleValidationErrors(fakeError, formGroup);

      expect(formGroup.controls.test_control_1.setErrors).toHaveBeenCalledWith({
        ixManualValidateError: {
          message: 'Error string for control 1',
        },
        manualValidateError: true,
        manualValidateErrorMsg: 'Error string for control 1',
      });
      expect(formGroup.controls.test_control_1.markAsTouched).toHaveBeenCalled();
    });

    it('shows error dialog and error message in logs when control is not found', () => {
      spectator.service.handleValidationErrors(fakeError, formGroup);

      expect(console.error).not.toHaveBeenCalledWith('Could not find control test_control_1.');
      expect(console.error).toHaveBeenCalledWith('Could not find control test_control_2.');
      expect(spectator.inject(DialogService).error).toHaveBeenCalledWith({
        title: fakeError.type,
        message: fakeError.reason,
        backtrace: fakeError.trace.formatted,
      });
    });

    it('scrolls element with an error into view', fakeAsync(() => {
      const elementMock = {
        scrollIntoView: jest.fn(),
        focus: jest.fn(),
      } as unknown as HTMLElement;
      jest.spyOn(spectator.inject(IxFormService), 'getElementByControlName').mockReturnValue(elementMock);

      spectator.service.handleValidationErrors(fakeError, formGroup);

      tick();

      expect(elementMock.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'center' }));
      expect(elementMock.focus).toHaveBeenCalled();
    }));
  });
});
