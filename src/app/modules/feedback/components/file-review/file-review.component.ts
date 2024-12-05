import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { ticketAcceptedFiles } from 'app/enums/file-ticket.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxStarRatingComponent } from 'app/modules/forms/ix-forms/components/ix-star-rating/ix-star-rating.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { ImageValidatorService } from 'app/modules/forms/ix-forms/validators/image-validator/image-validator.service';
import { rangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';

export const maxRatingValue = 5;
export const maxFileSizeBytes = 5 * MiB;

@UntilDestroy()
@Component({
  selector: 'ix-file-review',
  styleUrls: ['file-review.component.scss'],
  templateUrl: './file-review.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
    AsyncPipe,
  ],
})
export class FileReviewComponent {
  readonly dialogRef = input.required<MatDialogRef<FeedbackDialogComponent>>();
  readonly isLoading = input<boolean>();

  readonly isLoadingChange = output<boolean>();

  protected isEnterprise$ = this.systemGeneralService.isEnterprise$;

  protected form = this.formBuilder.group({
    rating: [undefined as number, [Validators.required, rangeValidator(1, maxRatingValue)]],
    message: ['', [Validators.maxLength(4067)]],

    images: [[] as File[], [], this.imageValidator.getImagesValidator(maxFileSizeBytes)],
    attach_images: [false],
    take_screenshot: [true],
  });

  protected readonly messagePlaceholder = helptext.review.message.placeholder;
  protected readonly voteForNewFeaturesText = helptext.review.vote_for_new_features;
  protected readonly acceptedFiles = ticketAcceptedFiles;

  constructor(
    private formBuilder: FormBuilder,
    private errorHandler: ErrorHandlerService,
    private imageValidator: ImageValidatorService,
    private feedbackService: FeedbackService,
    private systemGeneralService: SystemGeneralService,
  ) {}

  onSubmit(): void {
    this.isLoadingChange.emit(true);

    this.feedbackService.createReview(this.form.value).pipe(
      this.errorHandler.catchError(),
      finalize(() => this.isLoadingChange.emit(false)),
      untilDestroyed(this),
    ).subscribe(() => this.onSuccess());
  }

  private onSuccess(): void {
    this.feedbackService.showFeedbackSuccessMsg();
    this.dialogRef().close();
  }
}
