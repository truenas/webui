import { HttpErrorResponse } from '@angular/common/http';
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject,
} from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as EmailValidator from 'email-validator';
import {
  of, Observable, EMPTY, BehaviorSubject, throwError,
} from 'rxjs';
import {
  filter, map, switchMap, tap, catchError, take,
} from 'rxjs/operators';
import {
  ticketAcceptedFiles, TicketCategory, ticketCategoryLabels,
  TicketCriticality, ticketCriticalityLabels,
  TicketEnvironment, ticketEnvironmentLabels,
} from 'app/enums/file-ticket.enum';
import { JobState } from 'app/enums/job-state.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { Job } from 'app/interfaces/job.interface';
import {
  CreateNewTicket, NewTicketResponse,
} from 'app/interfaces/support.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { GeneralDialogConfig } from 'app/modules/common/dialog/general-dialog/general-dialog.component';
import { ixManualValidateError } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { DialogService } from 'app/services/dialog.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './file-ticket-licensed-form.component.html',
  styleUrls: ['./file-ticket-licensed-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTicketLicensedFormComponent implements OnInit {
  isFormLoading = true;

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    cc: [[] as string[], [
      this.validatorsService.customValidator(
        (control: AbstractControl<string[]>) => {
          return control.value?.every((item: string) => EmailValidator.validate(item));
        },
        this.translate.instant(helptext.cc.err),
      ),
    ]],
    phone: ['', [Validators.required]],
    category: [TicketCategory.Bug, [Validators.required]],
    environment: [TicketEnvironment.Production, [Validators.required]],
    criticality: [TicketCriticality.Inquiry, [Validators.required]],
    title: ['', Validators.required],
    body: ['', Validators.required],
    attach_debug: [false],
    screenshot: [null as File[]],
  });

  readonly acceptedFiles = ticketAcceptedFiles;
  readonly categoryOptions$ = of(mapToOptions(ticketCategoryLabels, this.translate));
  readonly environmentOptions$ = of(mapToOptions(ticketEnvironmentLabels, this.translate));
  readonly criticalityOptions$ = of(mapToOptions(ticketCriticalityLabels, this.translate));

  tooltips = {
    name: helptext.name.tooltip,
    email: helptext.email.tooltip,
    cc: helptext.cc.tooltip,
    phone: helptext.phone.tooltip,
    category: helptext.type.tooltip,
    environment: helptext.environment.tooltip,
    criticality: helptext.criticality.tooltip,
    title: helptext.title.tooltip,
    body: helptext.body.tooltip,
    attach_debug: helptext.attach_debug.tooltip,
    screenshot: helptext.screenshot.tooltip,
  };

  private screenshots: File[] = [];
  jobs$ = new BehaviorSubject<Observable<Job>[]>([]);

  constructor(
    private ws: WebSocketService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private slideInRef: IxSlideInRef<FileTicketLicensedFormComponent>,
    private errorHandler: FormErrorHandlerService,
    private fileUpload: IxFileUploadService,
    private dialog: DialogService,
    private router: Router,
    private validatorsService: IxValidatorsService,
    @Inject(WINDOW) private window: Window,
  ) { }

  ngOnInit(): void {
    this.isFormLoading = false;

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

  onSubmit(): void {
    const payload = { ...this.form.value };
    delete payload.screenshot;

    this.isFormLoading = true;
    this.ws.job('support.new_ticket', [payload as CreateNewTicket]).pipe(
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
            /** TODO:
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
              this.isFormLoading = false;
              this.openSuccessDialog(job.result);
            },
          });
          this.screenshots.forEach((file) => {
            this.fileUpload.upload(file, 'support.attach_ticket', [{
              ticket: job.result.ticket,
              filename: file.name,
            }]);
          });
        } else {
          this.isFormLoading = false;
          this.openSuccessDialog(job.result);
        }
      },
      error: (error) => {
        console.error(error);
        this.isFormLoading = false;
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
      catchError((error) => throwError( () => error)),
    );
  }

  onUserGuidePressed(): void {
    this.window.open('https://www.truenas.com/docs/hub/');
  }

  onEulaPressed(): void {
    this.slideInRef.close();
    this.router.navigate(['system', 'support', 'eula']);
  }
}
