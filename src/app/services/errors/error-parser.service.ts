import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { apiErrorNames } from 'app/enums/api.enum';
import {
  isApiCallError,
  isApiErrorDetails,
  isErrorResponse,
  isFailedJob,
  isFailedJobError,
} from 'app/helpers/api.helper';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { Job } from 'app/interfaces/job.interface';
import { FailedJobError } from 'app/services/errors/error.classes';

@Injectable({
  providedIn: 'root',
})
export class ErrorParserService {
  constructor(
    private translate: TranslateService,
  ) {}

  getFirstErrorMessage(error: unknown): string | undefined {
    const parsedError = this.parseError(error);
    if (Array.isArray(parsedError)) {
      return parsedError[0].message;
    }
    return parsedError?.message;
  }

  private isHttpError(obj: unknown): obj is HttpErrorResponse {
    return obj instanceof HttpErrorResponse;
  }

  /**
   * Prefer `showErrorModal(error)`
   */
  parseError(error: unknown): ErrorReport | ErrorReport[] | null {
    if (isApiCallError(error)) {
      if (isApiErrorDetails(error.error.data)) {
        return this.parseApiError(error.error.data);
      }

      return this.parseRawJsonRpcError(error.error);
    }

    if (isFailedJobError(error)) {
      return this.parseJobError(error);
    }
    if (this.isHttpError(error)) {
      return this.parseHttpError(error);
    }
    if (error instanceof Error) {
      return {
        title: this.translate?.instant('Error') || 'Error',
        message: error.message,
      };
    }

    // TODO: Items below should not be happening, but were kept for compatibility purposes.
    if (isErrorResponse(error)) {
      console.error('Unexpected error response:', error);
      const actualError = error.error;
      if (isApiErrorDetails(actualError.data)) {
        return this.parseApiError(actualError.data);
      }
      return this.parseRawJsonRpcError(actualError);
    }

    if (isFailedJob(error)) {
      console.error('Unexpected failed job', error);
      return this.parseJobError(new FailedJobError(error));
    }

    if (isApiErrorDetails(error)) {
      console.error('Unexpected api error details:', error);
      return this.parseApiError(error);
    }

    return null;
  }

  private parseApiError(error: ApiErrorDetails): ErrorReport {
    const title = apiErrorNames.has(error.errname)
      ? this.translate.instant(apiErrorNames.get(error.errname) || error.errname)
      : error.trace?.class || this.translate.instant('Error');

    return {
      title,
      message: error.reason || error?.error?.toString(),
      backtrace: error.trace?.formatted || '',
    };
  }

  private parseJobError(failedJob: FailedJobError): ErrorReport | ErrorReport[] {
    const job = { ...failedJob.job };
    if (job.exc_info?.extra) {
      job.extra = job.exc_info.extra as Record<string, unknown>;
    }

    if (job.extra && Array.isArray(job.extra)) {
      return this.parseJobWithArrayExtra(job);
    }

    return {
      title: job.state,
      message: job.error,
      backtrace: job.logs_excerpt || job.exception,
    };
  }

  private parseJobWithArrayExtra(errorJob: Job): ErrorReport[] {
    const errors: ErrorReport[] = [];
    (errorJob.extra as unknown as unknown[]).forEach((extraItem: [string, unknown]) => {
      const field = extraItem[0].split('.')[1];
      const extractedError = extraItem[1] as string | ApiErrorDetails | FailedJobError;

      const parsedError = this.parseJobExtractedError(errorJob, extractedError);

      if (Array.isArray(parsedError)) {
        for (const err of parsedError) {
          if (err.title === (this.translate?.instant('Error') || 'Error')) {
            err.title = err.title + ': ' + field;
          } else {
            err.title = field + ': ' + err.title;
          }
          errors.push(err);
        }
      } else {
        if (parsedError.title === (this.translate?.instant('Error') || 'Error')) {
          parsedError.title = parsedError.title + ': ' + field;
        } else {
          parsedError.title = field + ': ' + parsedError.title;
        }
        errors.push(parsedError);
      }
    });
    return errors;
  }

  private parseJobExtractedError(
    errorJob: Job,
    extractedError: string | ApiErrorDetails | FailedJobError,
  ): ErrorReport | ErrorReport[] {
    let parsedError: ErrorReport | ErrorReport[];
    if (isApiErrorDetails(extractedError)) {
      parsedError = this.parseApiError(extractedError);
    } else if (isFailedJobError(extractedError)) {
      parsedError = this.parseJobError(extractedError);
    } else {
      parsedError = {
        title: (this.translate?.instant('Error') || 'Error'),
        message: extractedError,
        backtrace: errorJob.logs_path || errorJob.exception,
      };
    }
    return parsedError;
  }

  private parseHttpErrorObject(error: HttpErrorResponse): ErrorReport[] {
    const errors: ErrorReport[] = [];
    Object.keys(error.error as Record<string, string | string[]>).forEach((fieldKey) => {
      const errorEntity = (error.error as Record<string, string | string[]>)[fieldKey];
      if (typeof errorEntity === 'string') {
        errors.push({
          title: this.translate?.instant('Error') || 'Error',
          message: errorEntity,
        });
      } else {
        errorEntity.forEach((item: string) => {
          errors.push({
            title: this.translate?.instant('Error') || 'Error',
            message: item,
          });
        });
      }
    });
    return errors;
  }

  private parseRawJsonRpcError(error: JsonRpcError): ErrorReport {
    return {
      title: this.translate?.instant('Error') || 'Error',
      message: error.message,
    };
  }

  parseHttpError(error: HttpErrorResponse): ErrorReport | ErrorReport[] {
    switch (error.status) {
      case 401:
      case 403:
      case 404: {
        return {
          title: error.statusText,
          message: error.message,
        };
      }
      case 409: {
        return this.parseHttpErrorObject(error);
      }
      case 400: {
        if (typeof error.error === 'object') {
          return this.parseHttpErrorObject(error);
        }
        return {
          title: this.translate?.instant('Error ({code})', { code: error.status })
            || `Error (${error.status})`,
          message: String(error.error),
        };
      }
      case 500: {
        const errorMessage = (error.error as Record<string, string>)?.error_message;
        if (errorMessage) {
          return {
            title: this.translate?.instant('Error ({code})', { code: error.status })
              || `Error (${error.status})`,
            message: errorMessage,
          };
        }
        return {
          title: this.translate?.instant('Error ({code})', { code: error.status })
            || `Error (${error.status})`,
          message: this.translate?.instant('Server error: {error}', { error: error.message || error.error })
            || `Server error: ${error.message || error.error}`,
        };
      }
      default: {
        return {
          title: this.translate?.instant('Error ({code})', { code: error.status })
            || `Error (${error.status})`,
          message: error.message || this.translate?.instant('Fatal error! Check logs.') || 'Fatal error! Check logs.',
        };
      }
    }
  }
}
