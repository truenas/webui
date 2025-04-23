import { HttpErrorResponse, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Injector } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { ApiErrorName } from 'app/enums/api.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { ErrorParserService } from 'app/services/errors/error-parser.service';
import { AbortedJobError, ApiCallError, FailedJobError } from 'app/services/errors/error.classes';

const error = new Error('Dummy Error');
const wsError = new ApiCallError({
  message: 'Validation Error',
  data: {
    error: 11,
    errname: ApiErrorName.Validation,
    reason: '[EINVAL] user_update.smb: This attribute cannot be changed\n[EINVAL] user_update.smb: Password must be changed in order to enable SMB authentication\n',
    trace: {},
    extra: [],
  } as ApiErrorDetails,
} as JsonRpcError);

const failedJob = {
  method: 'cloudsync.sync_onetime',
  description: null,
  error: 'DUMMY_ERROR',
  exception: 'EXCEPTION',
  exc_info: null,
  logs_excerpt: 'LOGS',
  state: JobState.Failed,
} as Job;

const excInfo = {
  repr: 'ValidationErrors()',
  type: 'VALIDATION',
  extra: [
    [
      'cloud_sync_sync_onetime.path',
      'DUMMY_ERROR',
      22,
    ],
  ],
};

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

describe('ErrorParserService', () => {
  let spectator: SpectatorService<ErrorParserService>;
  const createService = createServiceFactory({
    service: ErrorParserService,
    providers: [
      mockProvider(Injector, {
        get: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('parseError', () => {
    it('parses json rpc error', () => {
      const errorReport = spectator.service.parseError(new ApiCallError({
        message: 'This error',
      } as JsonRpcError));

      expect(errorReport).toEqual({
        title: 'Error',
        message: 'This error',
      });
    });

    it('parses a websocket error', () => {
      const errorReport = spectator.service.parseError(wsError);

      expect(errorReport).toEqual({
        title: 'Validation Error',
        message: wsError.error.data.reason,
        stackTrace: '',
      });
    });

    it('parses an HTTP error', () => {
      const errorReport = spectator.service.parseError(httpError);

      expect(errorReport).toEqual({
        title: 'Error',
        message: 'This error occurred',
      });
    });

    it('parses a failed job', () => {
      const errorReport = spectator.service.parseError(new FailedJobError(failedJob));

      expect(errorReport).toEqual({
        title: 'FAILED',
        message: 'DUMMY_ERROR',
        stackTrace: 'LOGS',
      });
    });

    it('parses a failed job with exc info', () => {
      const errorReport = spectator.service.parseError(new FailedJobError({
        ...failedJob,
        exc_info: excInfo,
      } as Job));

      expect(errorReport).toEqual([{
        title: 'Error: path',
        message: 'DUMMY_ERROR',
        stackTrace: 'EXCEPTION',
      }]);
    });

    it('parses a generic JS error', () => {
      const errorReport = spectator.service.parseError(error);

      expect(errorReport).toEqual({
        title: 'Error',
        message: 'Dummy Error',
      });
    });

    it('returns a message for an aborted job', () => {
      const errorReport = spectator.service.parseError(new AbortedJobError({} as Job));

      expect(errorReport).toEqual({
        title: 'Aborted',
        message: 'Job aborted',
      });
    });
  });
});
