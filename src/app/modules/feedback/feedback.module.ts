import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { FlexModule } from '@ngbracket/ngx-layout';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CastModule } from 'app/modules/cast/cast.module';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FileTicketComponent } from 'app/modules/feedback/components/file-ticket/file-ticket.component';
import { FileTicketLicensedComponent } from 'app/modules/feedback/components/file-ticket-licensed/file-ticket-licensed.component';
import { SimilarIssuesComponent } from 'app/modules/feedback/components/similar-issues/similar-issues.component';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { OauthButtonModule } from 'app/modules/oauth-button/oauth-button.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  imports: [
    AppLoaderModule,
    CommonModule,
    IxFormsModule,
    IxIconModule,
    RouterModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TestIdModule,
    TranslateModule,
    OauthButtonModule,
    CastModule,
    FlexModule,
    NgxSkeletonLoaderModule,
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
