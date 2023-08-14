import { HttpErrorResponse, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Injector } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

const error = new Error('Dummy Error');
const wsError = {
  error: 1,
  extra: [['SOMETHING'], ['SOMETHING ELSE']],
  reason: 'SOME REASON',
  trace: {
    class: 'CLASS',
    formatted: 'FORMATTED',
    frames: null,
  },
  type: null,
} as WebsocketError;
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
  });

  describe('handleError', () => {
    it('logs normal error to console and sentry', () => {
      jest.spyOn(spectator.service, 'parseError');
      jest.spyOn(console, 'error');
      spectator.service.handleError(error);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(spectator.service.parseError).toHaveBeenCalledWith(error);
      expect(spectator.service.logToSentry).toHaveBeenCalledWith(error);
    });

    it('logs websocket error', () => {
      spectator.service.handleError(wsError);

      expect(spectator.service.logToSentry).toHaveBeenCalledWith({
        backtrace: 'FORMATTED',
        message: 'SOME REASON',
        title: 'CLASS',
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
});
