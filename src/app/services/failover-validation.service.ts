import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, Observable, of, catchError, exhaustMap, filter, map, race, switchMap, take, timeout, timer, finalize,
} from 'rxjs';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

export interface FailoverValidationResult {
  success: boolean;
  error?: string;
  errorType?: FailoverErrorType;
  isHaLicensed: boolean;
}

export enum FailoverErrorType {
  Timeout = 'timeout',
  ApiError = 'api_error',
  FailoverFailed = 'failover_failed',
}

@Injectable({ providedIn: 'root' })
export class FailoverValidationService {
  private api = inject(TypedApiService);
  private translate = inject(TranslateService);
  private loader = inject(LoaderService);

  private readonly FAILOVER_TIMEOUT_MS = 300000; // 5 minutes
  private readonly FAILOVER_POLL_INTERVAL_MS = 5000;
  private activeLoader = false;

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
          return of({ success: true, isHaLicensed: false });
        }

        // Check failover status (isHaLicensed is always true in this branch)
        return this.checkFailoverStatus();
      }),
      catchError((error: unknown) => this.handleApiError(error, 'check')),
    );
  }

  protected checkFailoverStatus(): Observable<FailoverValidationResult> {
    return this.api.call('failover.status').pipe(
      // Middleware types the status as a literal; the UI compares it against its enum.
      map((status) => status as FailoverStatus),
      switchMap((status) => {
        // SINGLE status means no failover is configured, proceed as normal
        if (status === FailoverStatus.Single) {
          return of({ success: true, isHaLicensed: true });
        }

        if (status !== FailoverStatus.Master) {
          return this.checkTakeoverInProgress();
        }

        // Status is MASTER, check for ongoing failover
        return this.checkFailoverDisabledReasons();
      }),
      catchError((error: unknown) => this.handleApiError(error, 'status', true)),
    );
  }

  /**
   * A node that is taking over is not MASTER yet: middleware reports `BACKUP` (its status from before
   * the failover, cached until the pools are imported) or `ELECTING`/`IMPORTING` for the first part
   * of its `vrrp_master` job, though it already holds the VIP the browser reconnected to. Signing in
   * then waits for the takeover instead of failing; any other node that is not MASTER is refused.
   */
  protected checkTakeoverInProgress(): Observable<FailoverValidationResult> {
    return this.api.call('failover.disabled.reasons').pipe(
      switchMap((reasons) => {
        if (!reasons.includes(FailoverDisabledReason.LocFailoverOngoing)) {
          return of(this.inconsistentStateResult());
        }

        return this.waitForFailoverCompletion().pipe(
          switchMap((result) => (result.success ? this.confirmMaster() : of(result))),
        );
      }),
      catchError((error: unknown) => this.handleApiError(error, 'reasons', true)),
    );
  }

  private confirmMaster(): Observable<FailoverValidationResult> {
    return this.api.call('failover.status').pipe(
      map((status) => {
        return status as FailoverStatus === FailoverStatus.Master
          ? { success: true, isHaLicensed: true }
          : this.inconsistentStateResult();
      }),
      catchError((error: unknown) => this.handleApiError(error, 'status', true)),
    );
  }

  private inconsistentStateResult(): FailoverValidationResult {
    return {
      success: false,
      isHaLicensed: true,
      error: this.translate.instant(
        'TrueNAS High Availability is in an inconsistent state. Please try again in a few minutes and contact the system administrator if the problem persists.',
      ),
      errorType: FailoverErrorType.FailoverFailed,
    };
  }

  protected checkFailoverDisabledReasons(): Observable<FailoverValidationResult> {
    return this.api.call('failover.disabled.reasons').pipe(
      switchMap((reasons) => {
        const hasOngoingFailover = reasons.includes(FailoverDisabledReason.LocFailoverOngoing);

        if (hasOngoingFailover) {
          return this.waitForFailoverCompletion();
        }

        // All checks passed
        return of({ success: true, isHaLicensed: true });
      }),
      catchError((error: unknown) => this.handleApiError(error, 'reasons', true)),
    );
  }

  protected waitForFailoverCompletion(): Observable<FailoverValidationResult> {
    this.loader.open(this.translate.instant('Waiting for failover operation to complete...'));
    this.activeLoader = true;

    const terminalStates = [
      JobState.Success,
      JobState.Failed,
      TaskState.Error,
      JobState.Aborted,
      TaskState.Finished,
    ];

    const jobFinished$ = this.api.subscribe('core.get_jobs').pipe(
      // A removal carries no job to inspect. The UI's `Job` narrows the generated entry's loose fields.
      map((event) => (event.msg === 'removed' ? null : event.fields as unknown as Job)),
      filter((job): job is Job => {
        return job?.method === 'failover.events.vrrp_master'
          && terminalStates.includes(job.state);
      }),
      take(1), // Take first event with terminal state
      map((job) => this.jobResult(job)),
    );

    // The job's last event can come before this subscription starts, and is then never seen: the
    // takeover is also over once this node stops reporting it, which is checked as well.
    const takeoverOver$ = timer(this.FAILOVER_POLL_INTERVAL_MS, this.FAILOVER_POLL_INTERVAL_MS).pipe(
      exhaustMap(() => this.api.call('failover.disabled.reasons').pipe(catchError(() => EMPTY))),
      filter((reasons) => !reasons.includes(FailoverDisabledReason.LocFailoverOngoing)),
      take(1),
      map((): FailoverValidationResult => ({ success: true, isHaLicensed: true })),
    );

    return race(jobFinished$, takeoverOver$).pipe(
      timeout(this.FAILOVER_TIMEOUT_MS),
      catchError((error: unknown) => this.handleApiError(error, 'operation', true)),
      finalize(() => {
        // Always clean up loader, even if component is destroyed
        if (this.activeLoader) {
          this.loader.close();
          this.activeLoader = false;
        }
      }),
    );
  }

  private jobResult(job: Job): FailoverValidationResult {
    if (job.state === JobState.Success) {
      return { success: true, isHaLicensed: true };
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

    return {
      success: false,
      isHaLicensed: true,
      error: errorMessage,
      errorType: FailoverErrorType.FailoverFailed,
    };
  }

  protected handleApiError(error: unknown, context: string, isHaLicensed = false):
  Observable<FailoverValidationResult> {
    const errorType = (error as Error).name === 'TimeoutError' ? FailoverErrorType.Timeout : FailoverErrorType.ApiError;
    return of({
      success: false,
      error: this.getErrorMessage(errorType, context),
      errorType,
      isHaLicensed,
    });
  }
}
