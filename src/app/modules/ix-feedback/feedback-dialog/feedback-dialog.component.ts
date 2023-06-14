import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import {
  filter, map, take,
} from 'rxjs';
import { ticketAcceptedFiles } from 'app/enums/file-ticket.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { AddReview, FeedbackEnvironment } from 'app/modules/ix-feedback/interfaces/feedback.interface';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
import { rangeValidator } from 'app/modules/ix-forms/validators/range-validation/range-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FileTicketFormComponent } from 'app/pages/system/file-ticket/file-ticket-form/file-ticket-form.component';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
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
  protected form = this.formBuilder.group({
    rating: [undefined as number, [Validators.required, rangeValidator(1, maxRatingValue)]],
    message: [''],
    image: [null as File[]],
  });
  private release: string;
  private image: File;
  readonly acceptedFiles = ticketAcceptedFiles;

  constructor(
    private formBuilder: FormBuilder,
    private slideIn: IxSlideInService,
    private dialogRef: MatDialogRef<FeedbackDialogComponent>,
    private feedbackService: IxFeedbackService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private fileUpload: IxFileUploadService,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    this.store$.pipe(
      waitForSystemInfo,
      take(1),
      untilDestroyed(this),
    ).subscribe(({ version }) => {
      this.release = version;
    });
    this.form.controls.image.valueChanges.pipe(
      filter((files) => !!files.length),
      map((files) => files[0]),
      untilDestroyed(this),
    ).subscribe((image) => {
      console.info('image', image);
      this.image = image;
      this.attachImageToReview(7, image);
    });
  }

  openFileTicketForm(): void {
    this.dialogRef.close();
    this.slideIn.open(FileTicketFormComponent);
  }

  onSubmit(): void {
    const values: AddReview = {
      host_u_id: UUID.UUID(),
      rating: this.form.controls.rating.value,
      message: this.form.controls.message.value,
      page: this.window.location.pathname,
      user_agent: this.window.navigator.userAgent,
      environment: environment.production ? FeedbackEnvironment.Production : FeedbackEnvironment.Development,
      release: this.release,
      extra: {},
    };

    this.feedbackService.addReview(values)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          if (this.form.controls.image.value && response.success) {
            this.attachImageToReview(response.review_id, this.image);
          } else {
            this.onSuccess();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.dialogService.error(this.errorHandler.parseHttpError(error));
        },
      });
  }

  private attachImageToReview(reviewId: number, image: File): void {
    this.feedbackService.addAttachment(reviewId, image)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (attachmentResponse) => {
          console.info('image uploaded', attachmentResponse);
          this.onSuccess();
        },
        error: (error: HttpErrorResponse) => {
          console.error(error);
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
      this.translate.instant('Thank you for sharing your feedback with us! Your insights are valuable in helping us improve our product.'),
    );
    this.dialogRef.close();
  }
}
