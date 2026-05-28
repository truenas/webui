import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, TemplateRef, computed, inject, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
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
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    FakeProgressBarComponent,
    NgxSkeletonLoaderModule,
    IxButtonGroupComponent,
    ReactiveFormsModule,
    FileReviewComponent,
    FileTicketLicensedComponent,
    FileTicketComponent,
    NgTemplateOutlet,
    TranslateModule,
    CastPipe,
  ],
})
export class FeedbackDialog implements OnInit {
  private feedbackService = inject(FeedbackService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);
  protected dialogRef = inject<DialogRef<unknown, FeedbackDialog>>(DialogRef);
  private requestedType = inject<FeedbackType | null>(DIALOG_DATA, { optional: true });
  private destroyRef = inject(DestroyRef);

  protected isLoading = false;
  protected isLoadingTypes = false;
  protected typeControl = new FormControl(undefined as FeedbackType | undefined);
  protected feedbackTypeOptions$: Observable<Option[]> = of(mapToOptions(feedbackTypesLabels, this.translate));
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected allowedTypes: FeedbackType[] = [];

  private fileReviewForm = viewChild(FileReviewComponent);
  private fileTicketForm = viewChild(FileTicketComponent);
  private fileTicketLicensedForm = viewChild(FileTicketLicensedComponent);

  // Action buttons live in the active form component; project them into the shell footer.
  protected readonly actionsTemplate = computed<TemplateRef<unknown> | undefined>(() => {
    return this.fileReviewForm()?.dialogActions()
      ?? this.fileTicketForm()?.dialogActions()
      ?? this.fileTicketLicensedForm()?.dialogActions();
  });

  get isReview(): boolean {
    return this.typeControl.value === FeedbackType.Review;
  }

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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isReviewAllowed) => {
        this.allowedTypes = [];

        if (isReviewAllowed) {
          this.allowedTypes.push(FeedbackType.Review);
        }

        this.allowedTypes.push(FeedbackType.Bug);

        const allowedOptions = this.allowedTypes.map((type) => ({
          label: this.translate.instant(feedbackTypesLabels.get(type) || type),
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
