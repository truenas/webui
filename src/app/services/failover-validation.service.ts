import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of, catchError, filter, switchMap, take, timeout, finalize,
} from 'rxjs';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApiService } from 'app/modules/websocket/api.service';

export interface FailoverValidationResult {
  success: boolean;
  error?: string;
  errorType?: FailoverErrorType;
}

export enum FailoverErrorType {
  Timeout = 'timeout',
  ApiError = 'api_error',
  FailoverFailed = 'failover_failed',
}

@Injectable({ providedIn: 'root' })
export class FailoverValidationService {
  private readonly FAILOVER_TIMEOUT_MS = 300000; // 5 minutes
  private activeLoader = false;

  constructor(
    private api: ApiService,
    private translate: TranslateService,
    private loader: AppLoaderService,
  ) {}

  /**
   * Get consistent error message based on error type and context
   */
  protected getErrorMessage(errorType: FailoverErrorType, context?: string): string {
    switch (errorType) {
      case FailoverErrorType.Timeout:
        switch (context) {
          case 'check':
            return this.translate.instant('Failover check timed out. Please try again.');
          case 'status':
            return this.translate.instant('Failover status check timed out. Please try again.');
          case 'reasons':
            return this.translate.instant('Failover disabled reasons check timed out. Please try again.');
          case 'operation':
            return this.translate.instant(
              'Failover operation timed out. This may indicate a problem with the failover process. Please contact the system administrator.',
            );
          default:
            return this.translate.instant('Operation timed out. Please try again.');
        }
      case FailoverErrorType.ApiError:
        return this.translate.instant(
          'Unable to check failover status. Please try again later or contact the system administrator.',
        );
      case FailoverErrorType.FailoverFailed:
        return this.translate.instant('Failover operation failed. Please try again later.');
      default:
        return this.translate.instant('An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Validates failover status before allowing login to proceed.
   * Returns true if validation passes or failover is not licensed.
   * Returns false if validation fails.
   */
  validateFailover(): Observable<FailoverValidationResult> {
    return this.api.call('failover.licensed').pipe(
      switchMap((isLicensed) => {
        if (!isLicensed) {
          // No failover license, validation passes
          return of({ success: true });
        }

        // Check failover status
        return this.checkFailoverStatus();
      }),
      catchError((error: unknown) => this.handleApiError(error, 'check')),
    );
  }

  protected checkFailoverStatus(): Observable<FailoverValidationResult> {
    return this.api.call('failover.status').pipe(
      switchMap((status) => {
        if (status !== FailoverStatus.Master) {
          return of({
            success: false,
            error: this.translate.instant(
              'TrueNAS High Availability is in an inconsistent state. Please try again in a few minutes and contact the system administrator if the problem persists.',
            ),
            errorType: FailoverErrorType.FailoverFailed,
          });
        }

        // Status is MASTER, check for ongoing failover
        return this.checkFailoverDisabledReasons();
      }),
      catchError((error: unknown) => this.handleApiError(error, 'status')),
    );
  }

  protected checkFailoverDisabledReasons(): Observable<FailoverValidationResult> {
    return this.api.call('failover.disabled.reasons').pipe(
      switchMap((reasons) => {
        const hasOngoingFailover = reasons.includes(FailoverDisabledReason.LocFailoverOngoing);

        if (hasOngoingFailover) {
          return this.waitForFailoverCompletion();
        }

        // All checks passed
        return of({ success: true });
      }),
      catchError((error: unknown) => this.handleApiError(error, 'reasons')),
    );
  }

  protected waitForFailoverCompletion(): Observable<FailoverValidationResult> {
    this.loader.open(this.translate.instant('Waiting for failover operation to complete...'));
    this.activeLoader = true;

    const terminalStates = [
      JobState.Success,
      JobState.Failed,
      JobState.Error,
      JobState.Aborted,
      JobState.Finished,
    ];

    return this.api.subscribe('core.get_jobs').pipe(
      filter((event) => {
        const job = event.fields as Job;
        return job.method === 'failover.events.vrrp_master'
          && terminalStates.includes(job.state);
      }),
      take(1), // Take first event with terminal state
      timeout(this.FAILOVER_TIMEOUT_MS),
      switchMap((event) => {
        const job = event.fields as Job;

        if (job.state === JobState.Success) {
          return of({ success: true });
        }

        // Handle all failure terminal states
        let errorMessage: string;
        if (job.state === JobState.Aborted) {
          errorMessage = this.translate.instant('Failover operation was aborted.');
        } else if (job.error) {
          errorMessage = this.translate.instant('Failover operation failed: {error}', { error: job.error });
        } else {
          errorMessage = this.getErrorMessage(FailoverErrorType.FailoverFailed);
        }

        return of({
          success: false,
          error: errorMessage,
          errorType: FailoverErrorType.FailoverFailed,
        });
      }),
      catchError((error: unknown) => this.handleApiError(error, 'operation')),
      finalize(() => {
        // Always clean up loader, even if component is destroyed
        if (this.activeLoader) {
          this.loader.close();
          this.activeLoader = false;
        }
      }),
    );
  }

  protected handleApiError(error: unknown, context: string): Observable<FailoverValidationResult> {
    const errorType = (error as Error).name === 'TimeoutError' ? FailoverErrorType.Timeout : FailoverErrorType.ApiError;
    return of({
      success: false,
      error: this.getErrorMessage(errorType, context),
      errorType,
    });
  }
}
