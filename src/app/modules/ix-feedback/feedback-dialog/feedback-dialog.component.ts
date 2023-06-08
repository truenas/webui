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
import { take } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { AddReview, FeedbackEnvironment } from 'app/modules/ix-feedback/interfaces/feedback.interface';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
import { rangeValidator } from 'app/modules/ix-forms/validators/range-validation/range-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FileTicketFormComponent } from 'app/pages/system/file-ticket/file-ticket-form/file-ticket-form.component';
import { DialogService } from 'app/services';
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
  protected form = this.formBuilder.group({
    rating: [undefined as number, [Validators.required, rangeValidator(1, maxRatingValue)]],
    message: [''],
  });
  private release: string;

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
  }

  openFileTicketForm(): void {
    this.dialogRef.close();
    this.slideIn.open(FileTicketFormComponent);
  }

  onSubmit(): void {
    const values: AddReview = {
      ...this.form.getRawValue(),
      host_u_id: UUID.UUID(),
      page: this.window.location.href,
      user_agent: this.window.navigator.userAgent,
      environment: environment.production ? FeedbackEnvironment.Production : FeedbackEnvironment.Development,
      release: this.release,
      extra: {},
    };

    this.feedbackService.addReview(values)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.snackbar.success(
            this.translate.instant('Thank you for sharing your feedback with us! Your insights are valuable in helping us improve our product.'),
          );
          this.dialogRef.close();
        },
        error: (error: HttpErrorResponse) => {
          this.dialogService.error(this.errorHandler.parseHttpError(error));
        },
      });
  }
}
