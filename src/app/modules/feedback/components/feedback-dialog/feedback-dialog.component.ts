import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of,
} from 'rxjs';
import { mapToOptions } from 'app/helpers/options.helper';
import { Option } from 'app/interfaces/option.interface';
import { FeedbackType, feedbackTypesLabels } from 'app/modules/feedback/interfaces/feedback.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
