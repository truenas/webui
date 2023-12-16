import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FeedbackDialogComponent } from 'app/modules/ix-feedback/feedback-dialog/feedback-dialog.component';
import { FileTicketFormComponent } from 'app/modules/ix-feedback/file-ticket-form/file-ticket-form.component';
import { FileTicketLicensedFormComponent } from 'app/modules/ix-feedback/file-ticket-licensed-form/file-ticket-licensed-form.component';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
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
  ],
  declarations: [
    FeedbackDialogComponent,
    FileTicketFormComponent,
    FileTicketLicensedFormComponent,
  ],
  providers: [
    IxFeedbackService,
  ],
})
export class IxFeedbackModule { }
