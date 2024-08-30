import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { OauthButtonModule } from 'app/modules/buttons/oauth-button/oauth-button.module';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FileTicketComponent } from 'app/modules/feedback/components/file-ticket/file-ticket.component';
import { FileTicketLicensedComponent } from 'app/modules/feedback/components/file-ticket-licensed/file-ticket-licensed.component';
import { SimilarIssuesComponent } from 'app/modules/feedback/components/similar-issues/similar-issues.component';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  IxButtonGroupComponent,
} from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxStarRatingComponent } from 'app/modules/forms/ix-forms/components/ix-star-rating/ix-star-rating.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  imports: [
    AppLoaderModule,
    CommonModule,
    IxIconModule,
    RouterModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TestIdModule,
    TranslateModule,
    OauthButtonModule,
    NgxSkeletonLoaderModule,
    CastPipe,
    IxButtonGroupComponent,
    IxStarRatingComponent,
    IxTextareaComponent,
    IxCheckboxComponent,
    IxFileInputComponent,
    FormActionsComponent,
    IxInputComponent,
    IxChipsComponent,
    IxSelectComponent,
  ],
  declarations: [
    FeedbackDialogComponent,
    FileTicketComponent,
    FileTicketLicensedComponent,
    FileReviewComponent,
    SimilarIssuesComponent,
  ],
  providers: [
    FeedbackService,
  ],
})
export class FeedbackModule { }
