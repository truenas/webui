import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, TemplateRef, computed, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonToggleComponent, TnButtonToggleGroupComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { mapToOptions } from 'app/helpers/options.helper';
import { generateUuid } from 'app/helpers/uuid.helper';
import { Option } from 'app/interfaces/option.interface';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FileTicketComponent } from 'app/modules/feedback/components/file-ticket/file-ticket.component';
import { FileTicketLicensedComponent } from 'app/modules/feedback/components/file-ticket-licensed/file-ticket-licensed.component';
import { FeedbackForm } from 'app/modules/feedback/interfaces/feedback-form';
import { FeedbackType, feedbackTypesLabels } from 'app/modules/feedback/interfaces/feedback.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.loading]': 'isLoading()',
  },
  imports: [
    TnDialogShellComponent,
    TnButtonToggleGroupComponent,
    TnButtonToggleComponent,
    FakeProgressBarComponent,
    NgxSkeletonLoaderModule,
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
  private store$ = inject<Store<AppState>>(Store);
  protected dialogRef = inject<DialogRef<unknown, FeedbackDialog>>(DialogRef);
  private requestedType = inject<FeedbackType | null>(DIALOG_DATA, { optional: true });
  private destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(false);
  protected readonly isLoadingTypes = signal(false);
  protected typeControl = new FormControl(undefined as FeedbackType | undefined);
  protected readonly feedbackTypeLabelId = `feedback-type-label-${generateUuid()}`;
  // Reassigned once the allowed types resolve; the signal lets OnPush change
  // detection pick up the new options without a manual markForCheck.
  protected readonly feedbackTypeOptions = signal<Option[]>(
    mapToOptions(feedbackTypesLabels, this.translate),
  );

  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly allowedTypes = signal<FeedbackType[]>([]);

  // Only one feedback form is rendered at a time; each provides the FeedbackForm
  // token, so a single query resolves to whichever is active.
  private activeForm = viewChild(FeedbackForm);

  // Action buttons live in the active form component; project them into the shell footer.
  protected readonly actionsTemplate = computed<TemplateRef<unknown> | undefined>(() => {
    return this.activeForm()?.dialogActions();
  });

  get isReview(): boolean {
    return this.typeControl.value === FeedbackType.Review;
  }

  ngOnInit(): void {
    this.loadFeedbackTypes();
  }

  onIsLoadingChange(isLoading: boolean): void {
    this.isLoading.set(isLoading);

    if (isLoading) {
      this.typeControl.disable();
      this.dialogRef.disableClose = true;
    } else {
      this.typeControl.enable();
      this.dialogRef.disableClose = false;
    }
  }

  private loadFeedbackTypes(): void {
    this.isLoading.set(true);
    this.isLoadingTypes.set(true);

    this.feedbackService.checkIfReviewAllowed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isReviewAllowed) => {
        const allowed: FeedbackType[] = [];

        if (isReviewAllowed) {
          allowed.push(FeedbackType.Review);
        }

        allowed.push(FeedbackType.Bug);

        this.allowedTypes.set(allowed);

        this.feedbackTypeOptions.set(allowed.map((type) => ({
          label: this.translate.instant(feedbackTypesLabels.get(type) || type),
          value: type,
        })));

        this.pickType();

        this.isLoading.set(false);
        this.isLoadingTypes.set(false);
      });
  }

  private pickType(): void {
    const allowed = this.allowedTypes();
    if (this.requestedType && allowed.includes(this.requestedType)) {
      this.typeControl.setValue(this.requestedType);
    } else {
      this.typeControl.setValue(allowed[0]);
    }
  }
}
