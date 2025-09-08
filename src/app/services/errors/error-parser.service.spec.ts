import { HttpErrorResponse, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Injector } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { ApiErrorName } from 'app/enums/api.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { ErrorReport } from 'app/interfaces/error-report.interface';
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
      const errorReport = spectator.service.parseError(wsError) as ErrorReport;

      expect(errorReport).toMatchObject({
        title: 'Validation Error',
        message: wsError.error.data.reason,
        stackTrace: undefined,
      });
      expect(errorReport.details).toBeDefined();
      expect(errorReport.details.length).toBeGreaterThan(0);
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

    it('shows network error message for ECONNRESET errors', () => {
      const connectionResetError = new ApiCallError({
        message: 'Connection reset error',
        data: {
          errname: ApiErrorName.ConnectionReset,
          error: 104,
          extra: null,
          reason: 'Connection reset by peer',
          trace: { formatted: 'stack trace here' },
        } as ApiErrorDetails,
      } as JsonRpcError);

      const errorReport = spectator.service.parseError(connectionResetError) as ErrorReport;

      expect(errorReport).toMatchObject({
        title: 'Network Error',
        message: 'Network connection was closed or timed out. Try again later.',
        icon: 'ix-cloud-off',
      });
      expect(errorReport).not.toHaveProperty('stackTrace');
      expect(errorReport.details).toBeDefined();
      expect(errorReport.details).toContainEqual({ label: 'Error Name', value: ApiErrorName.ConnectionReset });
      expect(errorReport.details).toContainEqual({ label: 'Error Code', value: 104 });
      expect(errorReport.details).toContainEqual({ label: 'Reason', value: 'Connection reset by peer' });
      expect(errorReport.details).toContainEqual({ label: 'Trace', value: 'stack trace here' });
    });

    it('shows network error message for ETIMEDOUT errors', () => {
      const timedOutError = new ApiCallError({
        message: 'Connection timed out',
        data: {
          errname: ApiErrorName.TimedOut,
          error: 110,
          extra: null,
          reason: 'Connection timed out',
          trace: { formatted: 'stack trace here' },
        } as ApiErrorDetails,
      } as JsonRpcError);

      const errorReport = spectator.service.parseError(timedOutError) as ErrorReport;

      expect(errorReport).toMatchObject({
        title: 'Network Error',
        message: 'Network connection was closed or timed out. Try again later.',
        icon: 'ix-cloud-off',
      });
      expect(errorReport).not.toHaveProperty('stackTrace');
      expect(errorReport.details).toBeDefined();
      expect(errorReport.details).toContainEqual({ label: 'Error Name', value: ApiErrorName.TimedOut });
      expect(errorReport.details).toContainEqual({ label: 'Error Code', value: 110 });
      expect(errorReport.details).toContainEqual({ label: 'Reason', value: 'Connection timed out' });
      expect(errorReport.details).toContainEqual({ label: 'Trace', value: 'stack trace here' });
    });

    it('shows network error message for ENETUNREACH errors', () => {
      const networkUnreachableError = new ApiCallError({
        message: 'Network unreachable',
        data: {
          errname: ApiErrorName.NetworkUnreachable,
          error: 101,
          extra: null,
          reason: 'Network is unreachable',
          trace: { formatted: 'stack trace here' },
        } as ApiErrorDetails,
      } as JsonRpcError);

      const errorReport = spectator.service.parseError(networkUnreachableError) as ErrorReport;

      expect(errorReport).toMatchObject({
        title: 'Network Error',
        message: 'Network resource is not reachable, verify your network settings and health.',
        hint: 'Double check that your nameservers and gateway are properly configured.',
        icon: 'ix-cloud-off',
        actions: [
          {
            label: 'Network Settings',
            route: '/system/network',
          },
        ],
      });
      expect(errorReport).not.toHaveProperty('stackTrace');
      expect(errorReport.details).toBeDefined();
      expect(errorReport.details).toContainEqual({ label: 'Error Name', value: ApiErrorName.NetworkUnreachable });
      expect(errorReport.details).toContainEqual({ label: 'Error Code', value: 101 });
      expect(errorReport.details).toContainEqual({ label: 'Reason', value: 'Network is unreachable' });
      expect(errorReport.details).toContainEqual({ label: 'Trace', value: 'stack trace here' });
    });

    it('includes detailed error information for API errors', () => {
      const apiError = new ApiCallError({
        message: 'API Error',
        data: {
          errname: 'CUSTOM_ERROR' as ApiErrorName,
          error: 500,
          extra: {
            field_name: 'username',
            validation_type: 'required',
          },
          reason: 'Validation failed',
          trace: {
            class: 'ValidationError',
            formatted: 'stack trace here',
          },
        } as ApiErrorDetails,
      } as JsonRpcError);

      const errorReport = spectator.service.parseError(apiError) as ErrorReport;

      expect(errorReport.details).toBeDefined();
      expect(errorReport.details).toContainEqual({ label: 'Error Name', value: 'CUSTOM_ERROR' });
      expect(errorReport.details).toContainEqual({ label: 'Error Code', value: 500 });
      expect(errorReport.details).toContainEqual({ label: 'Reason', value: 'Validation failed' });
      expect(errorReport.details).toContainEqual({ label: 'Error Class', value: 'ValidationError' });
      expect(errorReport.details).toContainEqual({ label: 'Field Name', value: 'username' });
      expect(errorReport.details).toContainEqual({ label: 'Validation Type', value: 'required' });
      expect(errorReport.details).toContainEqual({ label: 'Trace', value: 'stack trace here' });
    });
  });
});
