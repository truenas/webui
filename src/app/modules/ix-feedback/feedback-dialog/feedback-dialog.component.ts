import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { take } from 'rxjs';
import { ticketAcceptedFiles } from 'app/enums/file-ticket.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { AddReview, FeedbackEnvironment } from 'app/modules/ix-feedback/interfaces/feedback.interface';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
import { rangeValidator } from 'app/modules/ix-forms/validators/range-validation/range-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FileTicketFormComponent } from 'app/pages/system/file-ticket/file-ticket-form/file-ticket-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
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
  isLoading = false;

  protected form = this.formBuilder.group({
    rating: [undefined as number, [Validators.required, rangeValidator(1, maxRatingValue)]],
    message: [''],
    image: [null as File[]],
    take_screenshot: [true],
  });
  private release: string;
  private hostId: string;
  readonly acceptedFiles = ticketAcceptedFiles;

  constructor(
    private formBuilder: FormBuilder,
    private slideInService: IxSlideInService,
    private dialogRef: MatDialogRef<FeedbackDialogComponent>,
    private feedbackService: IxFeedbackService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
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
    this.feedbackService.getHostId().pipe(
      take(1),
      untilDestroyed(this),
    ).subscribe((hostId) => {
      this.hostId = hostId;
    });
  }

  openFileTicketForm(): void {
    this.dialogRef.close();
    this.slideInService.open(FileTicketFormComponent);
  }

  onSubmit(): void {
    this.isLoading = true;
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

    this.feedbackService.addReview(values)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          if (this.form.controls.take_screenshot.value && response.success) {
            this.feedbackService.takeScreenshot().pipe(untilDestroyed(this)).subscribe({
              next: (file) => {
                this.attachImageToReview(response.review_id, file);
              },
              error: (error) => {
                console.error(error);
                this.isLoading = false;
                this.cdr.markForCheck();
              },
            });
          } else if (this.form.controls.image.value?.length && response.success) {
            this.attachImageToReview(response.review_id, this.form.controls.image.value[0]);
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

  private attachImageToReview(reviewId: number, image: File): void {
    this.feedbackService.addAttachment(reviewId, image)
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
      this.translate.instant('Thank you for sharing your feedback with us! Your insights are valuable in helping us improve our product.'),
    );
    this.isLoading = false;
    this.dialogRef.close();
    this.cdr.markForCheck();
  }
}
