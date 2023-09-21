import { HttpErrorResponse } from '@angular/common/http';
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  of, Observable, EMPTY, BehaviorSubject, combineLatest, throwError,
} from 'rxjs';
import {
  filter, map, switchMap, debounceTime, tap, catchError, take,
} from 'rxjs/operators';
import { ticketAcceptedFiles, TicketType, ticketTypeLabels } from 'app/enums/file-ticket.enum';
import { JobState } from 'app/enums/job-state.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import {
  CreateNewTicket, NewTicketResponse,
} from 'app/interfaces/support.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { GeneralDialogConfig } from 'app/modules/common/dialog/general-dialog/general-dialog.component';
import { ixManualValidateError } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService } from 'app/services/dialog.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './file-ticket-form.component.html',
  styleUrls: ['./file-ticket-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTicketFormComponent implements OnInit {
  isFormLoading$ = new BehaviorSubject(true);
  form = this.fb.group({
    token: ['', [Validators.required]],
    category: ['', [Validators.required]],
    type: [TicketType.Bug, Validators.required],
    attach_debug: [false],
    title: ['', Validators.required],
    body: ['', Validators.required],
    screenshot: [null as File[]],
  });

  readonly acceptedFiles = ticketAcceptedFiles;
  readonly typeOptions$ = of(mapToOptions(ticketTypeLabels, this.translate));
  categoryOptions$: Observable<Option[]> = this.getCategories().pipe(
    tap((options) => this.form.controls.category.setDisable(!options.length)),
  );
  tooltips = {
    token: helptext.token.tooltip,
    type: helptext.type.tooltip,
    category: helptext.category.tooltip,
    attach_debug: helptext.attach_debug.tooltip,
    title: helptext.title.tooltip,
    body: helptext.body.tooltip,
    screenshot: helptext.screenshot.tooltip,
  };
  private screenshots: File[] = [];
  jobs$ = new BehaviorSubject<Observable<Job>[]>([]);
  isFormDisabled$ = combineLatest([this.form.status$, this.isFormLoading$]).pipe(
    map(([status, loading]) => status === 'INVALID' || loading),
  );
  readonly isEnterprise$ = this.sysGeneralService.isEnterprise$;
  constructor(
    private ws: WebSocketService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private sysGeneralService: SystemGeneralService,
    private slideInRef: IxSlideInRef<FileTicketFormComponent>,
    private errorHandler: FormErrorHandlerService,
    private fileUpload: IxFileUploadService,
    private dialog: DialogService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.form.controls.category.setDisable(true);
    this.restoreToken();
  }

  ngOnInit(): void {
    this.isFormLoading$.next(false);

    this.form.controls.token.value$.pipe(
      filter((token) => !!token),
      untilDestroyed(this),
    ).subscribe((token) => {
      this.sysGeneralService.setTokenForJira(token);
    });

    this.form.controls.screenshot.valueChanges.pipe(
      switchMap((screenshots) => this.fileUpload.validateScreenshots(screenshots)),
      catchError((error: WebsocketError) => {
        this.errorHandler.handleWsFormError(error, this.form);

        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((validatedFiles) => {
      const validScreenshots = validatedFiles.filter((file) => !file.error).map((file) => file.file);
      const invalidFiles = validatedFiles.filter((file) => file.error).map((file) => file.error);
      this.screenshots = validScreenshots;
      if (invalidFiles.length) {
        const message = invalidFiles.map((error) => `${error.name} – ${error.errorMessage}`).join('\n');
        this.form.controls.screenshot.setErrors({ [ixManualValidateError]: { message } });
      } else {
        this.form.controls.screenshot.setErrors(null);
      }
      this.cdr.markForCheck();
    });
  }

  getCategories(): Observable<Option[]> {
    return this.form.controls.token.value$.pipe(
      filter((token) => !!token),
      debounceTime(300),
      switchMap((token) => this.ws.call('support.fetch_categories', [token])),
      map((choices) => Object.entries(choices).map(([label, value]) => ({ label, value }))),
      map((options) => _.sortBy(options, ['label'])),
      catchError((error: WebsocketError) => {
        this.errorHandler.handleWsFormError(error, this.form);

        return EMPTY;
      }),
    );
  }

  restoreToken(): void {
    const token = this.sysGeneralService.getTokenForJira();
    if (token) {
      this.form.patchValue({ token });
    }
  }

  onSubmit(): void {
    const values = this.form.value;

    const payload = {
      category: values.category,
      title: values.title,
      body: values.body,
      type: values.type,
      token: values.token,
    } as CreateNewTicket;

    if (values.attach_debug) {
      // TODO: Improve UX for attaching debug
      // It possible to show job `system.generate_debug` or `system.debug`
      payload.attach_debug = values.attach_debug;
    }

    this.isFormLoading$.next(true);
    this.ws.job('support.new_ticket', [payload]).pipe(
      tap((job) => this.jobs$.next([this.getJobStatus(job.id)])),
      filter((job) => job.state === JobState.Success),
      untilDestroyed(this),
    ).subscribe({
      next: (job) => {
        if (this.screenshots.length) {
          this.fileUpload.onUploading$.pipe(
            untilDestroyed(this),
          ).subscribe({
            error: (error: HttpErrorResponse) => {
              this.dialog.error({
                title: this.translate.instant('Ticket'),
                message: this.translate.instant('Uploading screenshots has failed'),
                backtrace: `Error: ${error.status},\n ${error.error}\n ${error.message}`,
              });
            },
          });
          this.fileUpload.onUploaded$.pipe(
            take(this.screenshots.length),
            untilDestroyed(this),
          ).subscribe({
            next: () => {
            /**
             * TODO:
             * Improve UX for uploading screenshots
             * HttpResponse have `job_id`, it can be used to show progress.
             * const jobId = (res.body as { job_id: number }).job_id;
             * this.jobs$.next([this.getJobStatus(jobId), ...this.jobs$.value]);
            */
            },
            error: (error) => {
              // TODO: Improve error handling
              console.error(error);
            },
            complete: () => {
              this.isFormLoading$.next(false);
              this.openSuccessDialog(job.result);
            },
          });
          this.screenshots.forEach((file) => {
            this.fileUpload.upload(file, 'support.attach_ticket', [{
              ticket: job.result.ticket,
              filename: file.name,
              token: payload.token,
            }]);
          });
        } else {
          this.isFormLoading$.next(false);
          this.openSuccessDialog(job.result);
        }
      },
      error: (error) => {
        console.error(error);
        this.isFormLoading$.next(false);
        this.errorHandler.handleWsFormError(error, this.form);
      },
    });
  }

  openSuccessDialog(params: NewTicketResponse): void {
    const dialogConfig: GeneralDialogConfig = {
      title: this.translate.instant('Ticket'),
      message: this.translate.instant('Congratulations! Your ticket has been submitted successfully. It may take some time before images appear.'),
      confirmBtnMsg: this.translate.instant('Open Ticket'),
      cancelBtnMsg: this.translate.instant('Close'),
    };
    this.dialog.generalDialog(dialogConfig)
      .pipe(untilDestroyed(this))
      .subscribe((shouldOpen) => {
        if (shouldOpen) {
          this.window.open(params.url, '_blank');
        }
        this.slideInRef.close();
      });
  }

  getJobStatus(id: number): Observable<Job> {
    return this.ws.call('core.get_jobs', [[['id', '=', id]]]).pipe(
      map((jobs) => jobs[0]),
      catchError((error) => throwError(() => error)),
    );
  }
}
