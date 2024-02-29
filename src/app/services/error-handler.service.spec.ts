import { HttpErrorResponse, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Injector } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { WebSocketErrorName } from 'app/enums/websocket-error-name.enum';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

const error = new Error('Dummy Error');
const wsError = {
  error: 11,
  errname: WebSocketErrorName.Again,
  type: ResponseErrorType.Validation,
  reason: '[EINVAL] user_update.smb: This attribute cannot be changed\n[EINVAL] user_update.smb: Password must be changed in order to enable SMB authentication\n',
  trace: {},
  extra: [],
} as WebSocketError;
const failedJob = {
  method: 'cloudsync.sync_onetime',
  description: null,
  error: 'DUMMY_ERROR',
  exception: 'EXCEPTION',
  exc_info: {
    repr: 'ValidationErrors()',
    type: 'VALIDATION',
    extra: [
      [
        'cloud_sync_sync_onetime.path',
        'DUMMY_ERROR',
        22,
      ],
    ],
  },
  state: 'FAILED',
} as Job;

const httpError: HttpErrorResponse = {
  error: { name: 'This error' },
  name: 'HttpErrorResponse',
  message: 'This error occurred',
  headers: new HttpHeaders(),
  ok: false,
  status: 409,
  statusText: 'Conflict',
  type: HttpEventType.Response,
  url: '',
};

describe('ErrorHandlerService', () => {
  let spectator: SpectatorService<ErrorHandlerService>;
  const createService = createServiceFactory({
    service: ErrorHandlerService,
    providers: [
      mockProvider(Injector, {
        get: jest.fn(),
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

    const translateService = spectator.inject(TranslateService);
    Object.defineProperty(spectator.service, 'translate', {
      value: translateService,
    });

    Object.defineProperty(spectator.service, 'logToSentry', {
      value: jest.fn(),
    });

    jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('handleError', () => {
    it('logs normal error to console and sentry', () => {
      jest.spyOn(spectator.service, 'parseError');
      spectator.service.handleError(error);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(spectator.service.parseError).toHaveBeenCalledWith(error);
      expect(spectator.service.logToSentry).toHaveBeenCalledWith({
        message: 'Dummy Error',
        title: 'Error',
      });
    });

    it('does not log Websocket CloseEvent to Sentry', () => {
      spectator.service.handleError(new CloseEvent('close'));

      expect(spectator.service.logToSentry).not.toHaveBeenCalled();
    });

    it('logs websocket error', () => {
      spectator.service.handleError(wsError);

      expect(spectator.service.logToSentry).toHaveBeenCalledWith({
        backtrace: '',
        message: wsError.reason,
        title: 'VALIDATION',
      });
    });

    it('logs job error', () => {
      spectator.service.handleError(failedJob);

      expect(spectator.service.logToSentry).toHaveBeenCalledWith([{
        backtrace: 'EXCEPTION',
        message: 'DUMMY_ERROR',
        title: 'Error: path',
      }]);
    });
  });

  describe('parseHttpError', () => {
    it('returns correct error object with 409 error', () => {
      const errorReport = spectator.service.parseHttpError(httpError);
      expect(errorReport).toEqual([{ message: 'This error', title: 'Error' }]);
    });

    it('returns correct error object with 409 error with object', () => {
      const errorReport = spectator.service.parseHttpError({
        ...httpError,
        error: { name: ['This error'] },
      });
      expect(errorReport).toEqual([{ message: 'This error', title: 'Error' }]);
    });

    it('returns correct object with 400 error', () => {
      const errorReport = spectator.service.parseHttpError({
        ...httpError,
        status: 400,
        statusText: 'Bad Request',
      });
      expect(errorReport).toEqual([{ message: 'This error', title: 'Error' }]);
    });

    it('returns correct object with 400 error without error object', () => {
      const errorReport = spectator.service.parseHttpError({
        ...httpError,
        status: 400,
        statusText: 'Bad Request',
        error: 'That error',
      });
      expect(errorReport).toEqual({ message: 'That error', title: 'Error (400)' });
    });

    it('returns correct object with 500 error', () => {
      const errorReport = spectator.service.parseHttpError({
        ...httpError,
        status: 500,
        statusText: 'Bad Request',
        error: { error_message: 'Even error' },
      });
      expect(errorReport).toEqual({ message: 'Even error', title: 'Error (500)' });
    });

    it('returns correct object with 500 error and string', () => {
      const errorReport = spectator.service.parseHttpError({
        ...httpError,
        status: 500,
        statusText: 'Bad Request',
        error: 'Odd error',
      });
      expect(errorReport).toEqual({ message: 'Server error: Odd error', title: 'Error (500)' });
    });

    it('returns proper object when unknown error', () => {
      const errorReport = spectator.service.parseHttpError({
        ...httpError,
        status: 510,
        statusText: 'Bad Request',
        error: 'Odd error',
      });

      expect(console.error).toHaveBeenCalledWith('Unknown error code', 510);

      expect(errorReport).toEqual({ message: 'Fatal error! Check logs.', title: 'Error (510)' });
    });
  });

  describe('parseError', () => {
    it('parses a websocket error', () => {
      const errorReport = spectator.service.parseError(wsError);

      expect(errorReport).toEqual({
        title: 'VALIDATION',
        message: wsError.reason,
        backtrace: '',
      });
    });

    it('parses a failed job', () => {
      const errorReport = spectator.service.parseError(failedJob);

      expect(errorReport).toEqual([{
        title: 'Error: path',
        message: 'DUMMY_ERROR',
        backtrace: 'EXCEPTION',
      }]);
    });

    it('parses a generic JS error', () => {
      const errorReport = spectator.service.parseError(error);

      expect(errorReport).toEqual({
        title: 'Error',
        message: 'Dummy Error',
      });
    });
  });
});
