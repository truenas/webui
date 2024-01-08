import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewChild, ViewContainerRef,
} from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import {
  EMPTY, Observable, catchError, delay, distinctUntilChanged, filter, of, pairwise, switchMap, take,
} from 'rxjs';
import { TicketType, ticketAcceptedFiles } from 'app/enums/file-ticket.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { Option } from 'app/interfaces/option.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { FileTicketFormComponent } from 'app/modules/ix-feedback/file-ticket-form/file-ticket-form.component';
import { FileTicketLicensedFormComponent } from 'app/modules/ix-feedback/file-ticket-licensed-form/file-ticket-licensed-form.component';
import {
  AddReview, FeedbackEnvironment, FeedbackType, feedbackTypeOptionMap,
} from 'app/modules/ix-feedback/interfaces/feedback.interface';
import { CreateNewTicket } from 'app/modules/ix-feedback/interfaces/file-ticket.interface';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
import { ixManualValidateError } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { rangeValidator } from 'app/modules/ix-forms/validators/range-validation/range-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { SentryService } from 'app/services/sentry.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsIxHardware, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

export const maxRatingValue = 5;

@UntilDestroy()
@Component({
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackDialogComponent implements OnInit {
  @ViewChild('ticketFormContainer', { static: true, read: ViewContainerRef }) ticketFormContainer: ViewContainerRef;
  ticketForm: FileTicketFormComponent | FileTicketLicensedFormComponent;
  isLoading = false;

  protected form = this.formBuilder.group({
    type: [undefined as FeedbackType],

    rating: [undefined as number, [Validators.required, rangeValidator(1, maxRatingValue)]],
    message: [''],

    token: [''],

    image: [null as File[]],
    attach_debug: [false],
    attach_screenshot: [false],
    take_screenshot: [true],
  });

  private release: string;
  private hostId: string;
  private sessionId: string;
  private productType: ProductType;
  private systemProduct: string;
  private isIxHardware = false;
  private attachments: File[] = [];
  protected feedbackTypeOptions$: Observable<Option[]> = of(mapToOptions(feedbackTypeOptionMap, this.translate));
  readonly acceptedFiles = ticketAcceptedFiles;

  get isEnterprise(): boolean {
    return this.systemGeneralService.isEnterprise;
  }

  get isReview(): boolean {
    return this.form.controls.type.value === FeedbackType.Review;
  }

  get isBugOrFeature(): boolean {
    return [FeedbackType.Bug, FeedbackType.Suggestion].includes(this.form.controls.type.value);
  }

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

  get showJiraButton(): boolean {
    if (this.isReview
        || this.isEnterprise
        || this.form.controls.token.disabled
        || this.form.controls.token.value
    ) {
      return false;
    }

    return true;
  }

  readonly tooltips = {
    token: helptext.token.tooltip,
    type: helptext.type.tooltip,
    category: helptext.category.tooltip,
    attach_debug: helptext.attach_debug.tooltip,
    screenshot: helptext.screenshot.tooltip,

    name: helptext.name.tooltip,
    email: helptext.email.tooltip,
    cc: helptext.cc.tooltip,
    phone: helptext.phone.tooltip,
    environment: helptext.environment.tooltip,
    criticality: helptext.criticality.tooltip,
  };

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
    private sentryService: SentryService,
    @Inject(WINDOW) private window: Window,
    @Inject(MAT_DIALOG_DATA) private type: FeedbackType,
  ) {}

  ngOnInit(): void {
    this.addFormListeners();
    this.getReleaseVersion();
    this.getHostId();
    this.getProductType();
    this.getSessionId();
    this.getFeedbackTypeOptions();
    this.loadIsIxHardware();
    this.restoreToken();
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
        this.submitBugOrFeature();
        break;
    }
  }

  onUserGuidePressed(): void {
    this.window.open('https://www.truenas.com/docs/hub/');
  }

  onEulaPressed(): void {
    this.router.navigate(['system', 'support', 'eula']);
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
              this.isLoading = false;
              this.cdr.markForCheck();
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
      error: (error: unknown) => {
        console.error(error);
        this.isLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
      },
    });
  }

  private submitBugOrFeature(): void {
    const values = this.form.value;
    const ticketValues = this.ticketForm.getPayload();
    const hostText = `Host ID: ${this.hostId}`;
    const sessionText = `Session ID: ${this.sessionId}`;
    const body = [values.message, hostText, sessionText].join('\n\n');

    let payload: CreateNewTicket = {
      token: values.token,
      attach_debug: values.attach_debug,
      type: values.type === FeedbackType.Bug ? TicketType.Bug : TicketType.Suggestion,
      category: ticketValues.category,
      title: ticketValues.title,
      body,
    };

    if (this.isEnterprise) {
      payload = {
        name: ticketValues.name,
        email: ticketValues.email,
        phone: ticketValues.phone,
        cc: ticketValues.cc,
        environment: ticketValues.environment,
        criticality: ticketValues.criticality,
        category: ticketValues.category,
        title: ticketValues.title,
        attach_debug: values.attach_debug,
        body,
      };
    }

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
      product_type: this.productType,
      product_model: this.systemProduct && this.isIxHardware ? this.systemProduct : 'Generic',
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
          this.dialogService.error({
            title: this.translate.instant('Uploading failed.'),
            message: error.message,
            backtrace: JSON.stringify(error, null, '  '),
          });
          this.isLoading = false;
          this.cdr.markForCheck();
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

    this.form.controls.type.valueChanges
      .pipe(pairwise(), untilDestroyed(this))
      .subscribe(([previousType, currentType]) => {
        if (currentType === FeedbackType.Review) {
          this.switchToReview();
          this.clearTicketForm();
        } else if ([FeedbackType.Bug, FeedbackType.Suggestion].includes(currentType)) {
          this.switchToBugOrImprovement();
          if (![FeedbackType.Bug, FeedbackType.Suggestion].includes(previousType)) {
            this.renderTicketForm();
          }
        }
      });

    this.form.controls.token.valueChanges.pipe(
      filter((token) => !!token),
      distinctUntilChanged(),
      delay(10),
      untilDestroyed(this),
    ).subscribe((token) => {
      this.feedbackService.setOauthToken(token);
      if (this.form.valid && !this.isLoading) {
        this.onSubmit();
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

  private getProductType(): void {
    this.systemGeneralService.getProductType$.pipe(
      take(1),
      untilDestroyed(this),
    ).subscribe((productType) => {
      this.productType = productType;
    });
  }

  private loadIsIxHardware(): void {
    this.store$
      .select(selectIsIxHardware)
      .pipe(untilDestroyed(this))
      .subscribe((isIxHardware) => {
        this.isIxHardware = isIxHardware;
        this.cdr.markForCheck();
      });
  }

  private getReleaseVersion(): void {
    this.store$.pipe(waitForSystemInfo, take(1), untilDestroyed(this)).subscribe((systemInfo) => {
      this.release = systemInfo.version;
      this.systemProduct = systemInfo.system_product;
    });
  }

  private switchToReview(): void {
    this.form.controls.token.disable();
    this.form.controls.token.removeValidators(Validators.required);
    this.form.controls.message.removeValidators(Validators.required);
    this.form.controls.attach_debug.disable();

    this.form.controls.rating.enable();
  }

  private switchToBugOrImprovement(): void {
    this.form.controls.token.enable();
    this.form.controls.token.addValidators(Validators.required);
    this.form.controls.message.addValidators(Validators.required);
    this.form.controls.attach_debug.enable();

    this.form.controls.rating.disable();
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

  private clearTicketForm(): void {
    this.ticketForm = null;
    this.ticketFormContainer?.clear();
    this.cdr.markForCheck();
  }

  private renderTicketForm(): void {
    this.clearTicketForm();

    if (this.isEnterprise) {
      this.ticketForm = this.ticketFormContainer.createComponent(FileTicketLicensedFormComponent).instance;
    } else {
      this.ticketForm = this.ticketFormContainer.createComponent(FileTicketFormComponent).instance;
    }

    this.cdr.markForCheck();
  }

  private restoreToken(): void {
    const token = this.feedbackService.getOauthToken();
    if (token) {
      this.form.controls.token.setValue(token);
    }
  }

  private getFeedbackTypeOptions(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.feedbackService.isReviewAllowed$
      .pipe(untilDestroyed(this))
      .subscribe((isReviewAllowed) => {
        const optionMap = new Map(feedbackTypeOptionMap);

        if (!isReviewAllowed) {
          optionMap.delete(FeedbackType.Review);
        }

        this.feedbackTypeOptions$ = of(mapToOptions(optionMap, this.translate));
        this.form.controls.type.enable();
        if (this.type && optionMap.has(this.type)) {
          this.form.controls.type.setValue(this.type);
        } else {
          this.form.controls.type.setValue([...optionMap.keys()].shift());
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private getSessionId(): void {
    this.sentryService.sessionId$
      .pipe(untilDestroyed(this))
      .subscribe((sessionId) => {
        this.sessionId = sessionId;
        this.cdr.markForCheck();
      });
  }
}
