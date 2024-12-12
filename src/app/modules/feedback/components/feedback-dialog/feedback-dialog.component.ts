import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  Observable, of,
} from 'rxjs';
import { mapToOptions } from 'app/helpers/options.helper';
import { Option } from 'app/interfaces/option.interface';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FileTicketComponent } from 'app/modules/feedback/components/file-ticket/file-ticket.component';
import { FileTicketLicensedComponent } from 'app/modules/feedback/components/file-ticket-licensed/file-ticket-licensed.component';
import { FeedbackType, feedbackTypesLabels } from 'app/modules/feedback/interfaces/feedback.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxButtonGroupComponent } from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FakeProgressBarComponent,
    MatDialogTitle,
    MatIconButton,
    MatDialogClose,
    TestDirective,
    IxIconComponent,
    NgxSkeletonLoaderModule,
    IxButtonGroupComponent,
    ReactiveFormsModule,
    FileReviewComponent,
    FileTicketLicensedComponent,
    FileTicketComponent,
    TranslateModule,
    CastPipe,
    AsyncPipe,
  ],
})
export class FeedbackDialogComponent implements OnInit {
  protected isLoading = false;
  protected isLoadingTypes = false;
  protected typeControl = new FormControl(undefined as FeedbackType);
  protected feedbackTypeOptions$: Observable<Option[]> = of(mapToOptions(feedbackTypesLabels, this.translate));
  protected isEnterprise$ = this.systemGeneralService.isEnterprise$;
  protected allowedTypes: FeedbackType[] = [];

  get isReview(): boolean {
    return this.typeControl.value === FeedbackType.Review;
  }

  constructor(
    private feedbackService: FeedbackService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private systemGeneralService: SystemGeneralService,
    protected dialogRef: MatDialogRef<FeedbackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private requestedType: FeedbackType,
  ) {}

  ngOnInit(): void {
    this.loadFeedbackTypes();
  }

  onIsLoadingChange(isLoading: boolean): void {
    this.isLoading = isLoading;

    if (isLoading) {
      this.typeControl.disable();
      this.dialogRef.disableClose = true;
    } else {
      this.typeControl.enable();
      this.dialogRef.disableClose = false;
    }

    this.cdr.markForCheck();
  }

  private loadFeedbackTypes(): void {
    this.isLoading = true;
    this.isLoadingTypes = true;
    this.cdr.markForCheck();

    this.feedbackService.checkIfReviewAllowed()
      .pipe(untilDestroyed(this))
      .subscribe((isReviewAllowed) => {
        this.allowedTypes = [];

        if (isReviewAllowed) {
          this.allowedTypes.push(FeedbackType.Review);
        }

        this.allowedTypes.push(FeedbackType.Bug);

        const allowedOptions = this.allowedTypes.map((type) => ({
          label: this.translate.instant(feedbackTypesLabels.get(type)),
          value: type,
        }));

        this.feedbackTypeOptions$ = of(allowedOptions);

        this.pickType();

        this.isLoading = false;
        this.isLoadingTypes = false;
        this.cdr.markForCheck();
      });
  }

  private pickType(): void {
    if (this.requestedType && this.allowedTypes.includes(this.requestedType)) {
      this.typeControl.setValue(this.requestedType);
    } else {
      this.typeControl.setValue(this.allowedTypes[0]);
    }
  }
}
