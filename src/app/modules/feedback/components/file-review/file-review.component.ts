import {
  ChangeDetectionStrategy,
  Component, EventEmitter,
  Inject, Input,
  Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import {
  finalize, forkJoin, Observable, of, switchMap, throwError,
} from 'rxjs';
import {
  catchError, filter, map, take,
} from 'rxjs/operators';
import { ticketAcceptedFiles } from 'app/enums/file-ticket.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import {
  AddReview,
  FeedbackEnvironment,
  ReviewAddedResponse,
} from 'app/modules/feedback/interfaces/feedback.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { ImageValidatorService } from 'app/modules/ix-forms/validators/image-validator/image-validator.service';
import { rangeValidator } from 'app/modules/ix-forms/validators/range-validation/range-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';
import { selectSystemInfoState } from 'app/store/system-info/system-info.selectors';

export const maxRatingValue = 5;

@UntilDestroy()
@Component({
  selector: 'ix-file-review',
  styleUrls: ['file-review.component.scss'],
  templateUrl: './file-review.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileReviewComponent {
  @Input() dialogRef: MatDialogRef<FeedbackDialogComponent>;
  @Input() isLoading: boolean;
  @Output() isLoadingChange = new EventEmitter<boolean>();

  protected form = this.formBuilder.group({
    rating: [undefined as number, [Validators.required, rangeValidator(1, maxRatingValue)]],
    message: [''],

    images: [[] as File[], [], this.imageValidator.validateImages()],
    attach_images: [false],
    take_screenshot: [true],
  });

  protected readonly messagePlaceholder = helptext.review.message.placeholder;
  protected readonly acceptedFiles = ticketAcceptedFiles;

  constructor(
    private formBuilder: FormBuilder,
    private errorHandler: ErrorHandlerService,
    private store$: Store<AppState>,
    private imageValidator: ImageValidatorService,
    private systemGeneralService: SystemGeneralService,
    private feedbackService: FeedbackService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    @Inject(WINDOW) private window: Window,
  ) {}

  onSubmit(): void {
    this.isLoadingChange.emit(true);

    this.prepareReview().pipe(
      switchMap((review) => this.addReview(review)),
      switchMap((reviewAdded) => {
        return this.addAttachmentsIfNeeded(reviewAdded.review_id).pipe(
          catchError((error) => {
            this.dialogService.error({
              title: this.translate.instant(helptext.attachmentsFailed.title),
              message: this.translate.instant(helptext.attachmentsFailed.reviewMessage),
            });

            return of(error);
          }),
        );
      }),
      finalize(() => this.isLoadingChange.emit(false)),
      untilDestroyed(this),
    )
      .subscribe(() => this.onSuccess());
  }

  private addReview(review: AddReview): Observable<ReviewAddedResponse> {
    return this.feedbackService.addReview(review).pipe(
      switchMap((response) => {
        if (!response.success) {
          return throwError(() => new Error(
            this.translate.instant('An error occurred while sending the review. Please try again later.'),
          ));
        }

        return of(response);
      }),
    );
  }

  private prepareReview(): Observable<AddReview> {
    return this.getSystemInfo().pipe(
      map(({ systemInfo, isIxHardware, systemHostId }) => {
        return {
          host_u_id: systemHostId,
          rating: this.form.controls.rating.value,
          message: this.form.controls.message.value,
          page: this.window.location.pathname,
          user_agent: this.window.navigator.userAgent,
          environment: environment.production ? FeedbackEnvironment.Production : FeedbackEnvironment.Development,
          release: systemInfo.version,
          product_type: this.systemGeneralService.getProductType(),
          product_model: systemInfo.system_product && isIxHardware ? systemInfo.system_product : 'Generic',
          extra: {},
        };
      }),
    );
  }

  private getSystemInfo(): Observable<SystemInfoState> {
    return this.store$.pipe(
      select(selectSystemInfoState),
      filter((systemInfoState) => Boolean(systemInfoState.systemInfo)),
      take(1),
    );
  }

  private addAttachmentsIfNeeded(reviewId: number): Observable<unknown> {
    const operations = [];

    if (this.form.controls.take_screenshot.value) {
      operations.push(
        this.feedbackService.takeScreenshot().pipe(
          switchMap((file) => this.addAttachment(reviewId, file)),
        ),
      );
    }

    if (this.form.controls.attach_images.value && this.form.controls.images.value?.length) {
      operations.push(
        ...this.form.controls.images.value.map((image) => this.addAttachment(reviewId, image)),
      );
    }

    if (!operations.length) {
      return of(undefined);
    }

    return forkJoin(operations);
  }

  private addAttachment(reviewId: number, image: File): Observable<unknown> {
    return this.feedbackService.addReviewAttachment(reviewId, image);
  }

  private onSuccess(): void {
    this.snackbar.success(
      this.translate.instant(
        'Thank you for sharing your feedback with us! Your insights are valuable in helping us improve our product.',
      ),
    );
    this.dialogRef.close();
  }
}
