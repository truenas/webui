import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import _ from 'lodash';
import { EMPTY, Observable, catchError, debounceTime, filter, map, of, switchMap, take, tap } from 'rxjs';
import { TicketType, ticketAcceptedFiles } from 'app/enums/file-ticket.enum';
import { JobState } from 'app/enums/job-state.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { Option } from 'app/interfaces/option.interface';
import { CreateNewTicket } from 'app/interfaces/support.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AddReview, FeedbackEnvironment, FeedbackType, feedbackTypeOptionMap } from 'app/modules/ix-feedback/interfaces/feedback.interface';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
import { ixManualValidateError } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { rangeValidator } from 'app/modules/ix-forms/validators/range-validation/range-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

export const maxRatingValue = 5;

@UntilDestroy()
@Component({
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackDialogComponent implements OnInit {
  isLoading = false;
  token = new FormControl('');

  protected form = this.formBuilder.group({
    type: [FeedbackType.Review],
    rating: [undefined as number, [Validators.required, rangeValidator(1, maxRatingValue)]],
    subject: ['', Validators.required],
    message: [''],
    image: [null as File[]],
    attach_debug: [false],
    attach_screenshot: [false],
    take_screenshot: [true],
    category: ['', [Validators.required]],
    token: [''],
  });
  private release: string;
  private hostId: string;
  private attachments: File[] = [];
  readonly feedbackTypeOptions$: Observable<Option[]> = of(mapToOptions(feedbackTypeOptionMap, this.translate));
  readonly FeedbackType = FeedbackType;
  readonly acceptedFiles = ticketAcceptedFiles;
  readonly categoryOptions$: Observable<Option[]> = this.getCategories().pipe(
    tap((options) => {
      if (options.length) {
        this.form.controls.category.enable();
      } else {
        this.form.controls.category.disable();
      }
    }),
  );

  get isReview(): boolean {
    return this.form.controls.type.value === FeedbackType.Review;
  }

  get showJiraButton(): boolean {
    return [FeedbackType.Bug, FeedbackType.Suggestion].includes(this.form.controls.type.value);
  }

  get showSubmitButton(): boolean {
    if (this.showJiraButton) {
      return !!this.token.value;
    }
    return true;
  }

  readonly tooltips = {
    token: helptext.token.tooltip,
    type: helptext.type.tooltip,
    category: helptext.category.tooltip,
    attach_debug: helptext.attach_debug.tooltip,
    subject: helptext.title.tooltip,
    screenshot: helptext.screenshot.tooltip,
  };

  get messagePlaceholder(): string {
    switch (this.form.controls.type.value) {
      case FeedbackType.Review:
        return helptext.review.message.placeholder;
      case FeedbackType.Bug:
      case FeedbackType.Suggestion:
      default:
        return helptext.bug.message.placeholder;
    }
  }

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<FeedbackDialogComponent>,
    private feedbackService: IxFeedbackService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private fileUpload: IxFileUploadService,
    private dialog: DialogService,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((values) => {
      console.info(values, this.form.status);
    });
    this.addFormListeners();
    this.switchToReview();
    this.getReleaseVersion();
    this.getHostId();
  }

  onSubmit(): void {
    this.isLoading = true;
    switch (this.form.controls.type.value) {
      case FeedbackType.Review:
        this.submitReview();
        break;
      case FeedbackType.Bug:
      case FeedbackType.Suggestion:
      default:
        this.submitBugOrImprovement();
        break;
    }

  }

  private submitBugOrImprovement(): void {
    const values = this.form.value;

    const payload = {
      category: values.category,
      title: values.subject,
      body: values.message,
      type: values.type as unknown as TicketType,
      token: values.token,
      attach_debug: values.attach_debug,
    } as CreateNewTicket;

    if (values.attach_debug) {
      // TODO: Improve UX for attaching debug
      // It possible to show job `system.generate_debug` or `system.debug`
      payload.attach_debug = values.attach_debug;
    }

    this.isLoading = true;
    this.ws.job('support.new_ticket', [payload]).pipe(
      filter((job) => job.state === JobState.Success),
      untilDestroyed(this),
    ).subscribe({
      next: (job) => {
        if (this.attachments.length) {
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
            take(this.attachments.length),
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
              this.isLoading = false;
              this.onSuccess();
            },
          });
          this.attachments.forEach((file) => {
            this.fileUpload.upload(file, 'support.attach_ticket', [{
              ticket: job.result.ticket,
              filename: file.name,
              token: payload.token,
            }]);
          });
        } else {
          this.isLoading = false;
          this.onSuccess();
        }
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
      },
    });
  }

  private submitReview(): void {
    const values: AddReview = {
      host_u_id: this.hostId,
      rating: this.form.controls.rating.value,
      message: this.form.controls.message.value,
      page: this.window.location.pathname,
      user_agent: this.window.navigator.userAgent,
      environment: environment.production ? FeedbackEnvironment.Production : FeedbackEnvironment.Development,
      release: this.release,
      extra: {},
    };

    this.feedbackService
      .addReview(values)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          if (this.form.controls.take_screenshot.value && response.success) {
            this.feedbackService
              .takeScreenshot()
              .pipe(untilDestroyed(this))
              .subscribe({
                next: (file) => {
                  this.addAttachment(response.review_id, file);
                },
                error: (error) => {
                  console.error(error);
                  this.isLoading = false;
                  this.cdr.markForCheck();
                },
              });
          } else if (this.form.controls.image.value?.length && response.success) {
            this.addAttachment(response.review_id, this.form.controls.image.value[0]);
          } else {
            this.onSuccess();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.dialogService.error(this.errorHandler.parseHttpError(error));
          this.cdr.markForCheck();
        },
      });
  }

  private addAttachment(reviewId: number, image: File): void {
    this.feedbackService
      .addAttachment(reviewId, image)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => this.onSuccess(),
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error({
            title: this.translate.instant('Uploading failed.'),
            message: error.message,
            backtrace: JSON.stringify(error, null, '  '),
          });
        },
      });
  }

  private onSuccess(): void {
    this.snackbar.success(
      this.translate.instant(
        'Thank you for sharing your feedback with us! Your insights are valuable in helping us improve our product.',
      ),
    );
    this.isLoading = false;
    this.dialogRef.close();
    this.cdr.markForCheck();
  }

  private addFormListeners(): void {
    this.imagesValidation();
    this.form.controls.type.valueChanges.pipe(untilDestroyed(this)).subscribe((type) => {
      console.info(type);
      if (type === FeedbackType.Review) {
        this.switchToReview();
      } else {
        this.switchToBugOrImprovement();
      }
    });
  }

  private getHostId(): void {
    this.feedbackService
      .getHostId()
      .pipe(take(1), untilDestroyed(this))
      .subscribe((hostId) => {
        this.hostId = hostId;
      });
  }

  private getReleaseVersion(): void {
    this.store$.pipe(waitForSystemInfo, take(1), untilDestroyed(this)).subscribe(({ version }) => {
      this.release = version;
    });
  }

  private switchToReview(): void {
    this.form.controls.message.removeValidators(Validators.required);
    this.form.controls.attach_debug.disable();
    this.form.controls.subject.disable();
    this.form.controls.category.disable();
    this.form.controls.token.disable();

    this.form.controls.rating.enable();
  }

  private switchToBugOrImprovement(): void {
    this.form.controls.message.addValidators(Validators.required);
    this.form.controls.attach_debug.enable();
    this.form.controls.subject.enable();
    this.form.controls.category.enable();
    this.form.controls.token.enable();

    this.form.controls.rating.disable();
  }

  private getCategories(): Observable<Option[]> {
    return this.form.controls.token.valueChanges.pipe(
      filter((token) => !!token),
      debounceTime(300),
      switchMap((token) => this.ws.call('support.fetch_categories', [token])),
      map((choices) => Object.entries(choices).map(([label, value]) => ({ label, value }))),
      map((options) => _.sortBy(options, ['label'])),
      catchError((error: WebsocketError) => {
        this.formErrorHandler.handleWsFormError(error, this.form);

        return EMPTY;
      }),
    );
  }

  private imagesValidation(): void {
    this.form.controls.image.valueChanges.pipe(
      switchMap((images) => this.fileUpload.validateScreenshots(images)),
      catchError((error: WebsocketError) => {
        this.formErrorHandler.handleWsFormError(error, this.form);

        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((validatedFiles) => {
      const validFiles = validatedFiles.filter((file) => !file.error).map((file) => file.file);
      const invalidFiles = validatedFiles.filter((file) => file.error).map((file) => file.error);
      this.attachments = validFiles;
      if (invalidFiles.length) {
        const message = invalidFiles.map((error) => `${error.name} – ${error.errorMessage}`).join('\n');
        this.form.controls.image.setErrors({ [ixManualValidateError]: { message } });
      } else {
        this.form.controls.image.setErrors(null);
      }
      this.cdr.markForCheck();
    });
  }
}
