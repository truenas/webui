import { Injector, NgZone } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ApiErrorName } from 'app/enums/api.enum';
import { JobState } from 'app/enums/job-state.enum';
import { JobExceptionType } from 'app/enums/response-error-type.enum';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ErrorParserService } from 'app/services/errors/error-parser.service';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';

const error = new Error('Dummy Error');
const validationError = new ApiCallError({
  message: 'Validation error',
  data: {
    error: 11,
    errname: ApiErrorName.Validation,
    reason: '[EINVAL] user_update.smb: This attribute cannot be changed\n[EINVAL] user_update.smb: Password must be changed in order to enable SMB authentication\n',
    trace: {},
    extra: [],
  } as ApiErrorDetails,
} as JsonRpcError);

describe('ErrorHandlerService', () => {
  let spectator: SpectatorService<ErrorHandlerService>;
  const createService = createServiceFactory({
    service: ErrorHandlerService,
    providers: [
      mockProvider(Injector, {
        get: jest.fn(),
      }),
      mockProvider(ErrorParserService, {
        parseError: jest.fn(() => ({
          message: 'Dummy Error',
          title: 'Error',
        } as ErrorReport)),
      }),
    ],
  });

  beforeEach(() => {
    jest.resetAllMocks();
    spectator = createService();

    const dialogService = spectator.inject(DialogService);
    Object.defineProperty(dialogService, 'error', {
      value: jest.fn(() => of(true)),
    });

    Object.defineProperty(spectator.service, 'dialog', {
      get: () => dialogService,
    });

    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(spectator.inject(NgZone), 'runOutsideAngular').mockImplementation();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('handleError', () => {
    it('logs an error to console and sentry', () => {
      spectator.service.handleError(error);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(spectator.inject(NgZone).runOutsideAngular).toHaveBeenCalled();
    });

    it('does not log Websocket CloseEvent to Sentry', () => {
      spectator.service.handleError(new CloseEvent('close'));

      expect(spectator.inject(NgZone).runOutsideAngular).not.toHaveBeenCalled();
    });

    it('does not log call validation errors to Sentry', () => {
      spectator.service.handleError(validationError);

      expect(spectator.inject(NgZone).runOutsideAngular).not.toHaveBeenCalled();
    });

    it('does not log job validation errors to Sentry', () => {
      spectator.service.handleError(new FailedJobError({
        id: 1,
        state: JobState.Failed,
        error: 'Validation error',
        exc_info: {
          type: JobExceptionType.Validation,
        },
      } as Job));

      expect(spectator.inject(NgZone).runOutsideAngular).not.toHaveBeenCalled();
    });
  });
});
