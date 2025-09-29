import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { ticketAcceptedFiles } from 'app/enums/file-ticket.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { FeedbackDialog } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxStarRatingComponent } from 'app/modules/forms/ix-forms/components/ix-star-rating/ix-star-rating.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { ImageValidatorService } from 'app/modules/forms/ix-forms/validators/image-validator/image-validator.service';
import { rangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

export const maxRatingValue = 5;
export const maxFileSizeBytes = 5 * MiB;

@UntilDestroy()
@Component({
  selector: 'ix-file-review',
  styleUrls: ['file-review.component.scss'],
  templateUrl: './file-review.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    ReactiveFormsModule,
    IxStarRatingComponent,
    IxTextareaComponent,
    IxCheckboxComponent,
    IxFileInputComponent,
    MatDialogActions,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class FileReviewComponent {
  private formBuilder = inject(FormBuilder);
  private errorHandler = inject(ErrorHandlerService);
  private imageValidator = inject(ImageValidatorService);
  private feedbackService = inject(FeedbackService);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);

  readonly dialogRef = input.required<MatDialogRef<FeedbackDialog>>();
  readonly isLoading = input<boolean>();

  readonly isLoadingChange = output<boolean>();

  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  protected form = this.formBuilder.group({
    rating: [undefined as number | undefined, [Validators.required, rangeValidator(1, maxRatingValue)]],
    message: ['', [Validators.maxLength(4067)]],

    images: [[] as File[], [], this.imageValidator.getImagesValidator(maxFileSizeBytes)],
    attach_images: [false],
    take_screenshot: [true],
  });

  protected readonly voteForNewFeaturesText = helptext.review.voteForNewFeatures;
  protected readonly acceptedFiles = ticketAcceptedFiles;

  protected get messagePlaceholderText(): TranslatedString {
    const rating = this.form.controls.rating.value;
    const baseText = this.translate.instant(helptext.review.message.placeholder);

    if ((rating !== maxRatingValue && rating > 2) || !rating) {
      return baseText;
    }

    const extra = rating <= 2
      ? this.translate.instant(helptext.review.message.placeholderLowRating)
      : this.translate.instant(helptext.review.message.placeholderHighRating);

    return `${baseText}\n\n${extra}` as TranslatedString;
  }

  onSubmit(): void {
    this.isLoadingChange.emit(true);

    this.feedbackService.createReview(this.form.value).pipe(
      this.errorHandler.withErrorHandler(),
      finalize(() => this.isLoadingChange.emit(false)),
      untilDestroyed(this),
    ).subscribe(() => this.onSuccess());
  }

  private onSuccess(): void {
    this.feedbackService.showFeedbackSuccessMessage();
    this.dialogRef().close();
  }
}
