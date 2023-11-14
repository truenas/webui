import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormControl, AbstractControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as EmailValidator from 'email-validator';
import { environment } from 'environments/environment';
import _ from 'lodash';
import { EMPTY, Observable, catchError, debounceTime, filter, map, of, switchMap, take } from 'rxjs';
import { TicketCategory, TicketCriticality, TicketEnvironment, TicketType, ticketAcceptedFiles, ticketCategoryLabels, ticketCriticalityLabels, ticketEnvironmentLabels } from 'app/enums/file-ticket.enum';
import { JobState } from 'app/enums/job-state.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { Option } from 'app/interfaces/option.interface';
import { CreateNewTicket } from 'app/interfaces/support.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AddReview, FeedbackEnvironment, FeedbackType, feedbackTypeOptionMap } from 'app/modules/ix-feedback/interfaces/feedback.interface';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
import { SimpleAsyncComboboxProvider } from 'app/modules/ix-forms/classes/simple-async-combobox-provider';
import { ixManualValidateError } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/ix-forms/validators/email-validation/email-validation';
import { rangeValidator } from 'app/modules/ix-forms/validators/range-validation/range-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { SystemGeneralService } from 'app/services/system-general.service';
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

    token: [''],
    category: ['', [Validators.required]],

    name: ['', [Validators.required]],
    email: ['', [Validators.required, emailValidator()]],
    phone: ['', [Validators.required]],
    ticketCategory: [TicketCategory.Bug, [Validators.required]],
    environment: [TicketEnvironment.Production, [Validators.required]],
    criticality: [TicketCriticality.Inquiry, [Validators.required]],
    cc: [[] as string[], [
      this.validatorsService.customValidator(
        (control: AbstractControl<string[]>) => {
          return control.value?.every((item: string) => EmailValidator.validate(item));
        },
        this.translate.instant(helptext.cc.err),
      ),
    ]],
  });
  private release: string;
  private hostId: string;
  private attachments: File[] = [];
  readonly environmentOptions$ = of(mapToOptions(ticketEnvironmentLabels, this.translate));
  readonly criticalityOptions$ = of(mapToOptions(ticketCriticalityLabels, this.translate));
  readonly feedbackTypeOptions$: Observable<Option[]> = of(mapToOptions(feedbackTypeOptionMap, this.translate));
  readonly FeedbackType = FeedbackType;
  readonly acceptedFiles = ticketAcceptedFiles;
  readonly enterpriseCategoryOptions$ = of(mapToOptions(ticketCategoryLabels, this.translate));
  readonly categoryProvider$ = new SimpleAsyncComboboxProvider(this.getCategories());

  get isEnterprise(): boolean {
    return this.systemGeneralService.isEnterprise;
  }

  get isReview(): boolean {
    return this.form.controls.type.value === FeedbackType.Review;
  }

  get isBugOrFeature(): boolean {
    return [FeedbackType.Bug, FeedbackType.Suggestion].includes(this.form.controls.type.value);
  }

  get showSubmitButton(): boolean {
    if (this.isBugOrFeature) {
      return !!this.form.controls.token.value;
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

    name: helptext.name.tooltip,
    email: helptext.email.tooltip,
    cc: helptext.cc.tooltip,
    phone: helptext.phone.tooltip,
    environment: helptext.environment.tooltip,
    criticality: helptext.criticality.tooltip,
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
    private router: Router,
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
    private systemGeneralService: SystemGeneralService,
    private validatorsService: IxValidatorsService,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
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
        if (this.isEnterprise) {
          this.submitBugOrFeatureForEnterprise();
          break;
        }
        this.submitBugOrFeature();
        break;
    }

  }

  private createNewTicket(payload: CreateNewTicket): void {
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
            next: () => {},
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

  private submitBugOrFeature(): void {
    const values = this.form.value;
    const payload = {
      category: values.category,
      title: values.subject,
      body: values.message,
      type: values.type as unknown as TicketType,
      token: values.token,
      attach_debug: values.attach_debug,
    } as CreateNewTicket;
    this.createNewTicket(payload);
  }

  private submitBugOrFeatureForEnterprise(): void {
    const values = this.form.value;
    const payload: CreateNewTicket = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      category: values.ticketCategory,
      title: values.subject,
      body: values.message,
      type: values.type as unknown as TicketType,
      attach_debug: values.attach_debug,
      criticality: values.criticality,
      environment: values.environment,
    };
    this.createNewTicket(payload);
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
          }
          if (this.form.controls.attach_screenshot.value
            && this.form.controls.image.value?.length
            && response.success) {
            this.addAttachment(response.review_id, this.form.controls.image.value[0]);
          }
          if (response.success) {
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
    this.toggleEnterpriseFields(false);
    this.form.controls.message.removeValidators(Validators.required);
    this.form.controls.attach_debug.disable();
    this.form.controls.subject.disable();
    this.form.controls.category.disable();
    this.form.controls.token.disable();
    this.form.controls.rating.enable();
  }

  private switchToBugOrImprovement(): void {
    this.toggleEnterpriseFields(this.isEnterprise);
    this.form.controls.message.addValidators(Validators.required);
    this.form.controls.attach_debug.enable();
    this.form.controls.subject.enable();
    this.form.controls.category.enable();
    this.form.controls.token.enable();
    this.form.controls.rating.disable();
    this.restoreJiraToken();
  }

  private toggleEnterpriseFields(value: boolean): void {
    if (value) {
      this.form.controls.name.enable();
      this.form.controls.email.enable();
      this.form.controls.phone.enable();
      this.form.controls.ticketCategory.enable();
      this.form.controls.environment.enable();
      this.form.controls.criticality.enable();
      this.form.controls.cc.enable();
    } else {
      this.form.controls.name.disable();
      this.form.controls.email.disable();
      this.form.controls.phone.disable();
      this.form.controls.ticketCategory.disable();
      this.form.controls.environment.disable();
      this.form.controls.criticality.disable();
      this.form.controls.cc.disable();
    }
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

  onUserGuidePressed(): void {
    this.window.open('https://www.truenas.com/docs/hub/');
  }

  onEulaPressed(): void {
    this.router.navigate(['system', 'support', 'eula']);
  }


  restoreJiraToken(): void {
    const token = this.systemGeneralService.getTokenForJira();
    if (token) {
      this.token.setValue(token);
      this.form.controls.token.setValue(token);
    }
  }
}
