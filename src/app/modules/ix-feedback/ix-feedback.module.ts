import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FeedbackDialogComponent } from 'app/modules/ix-feedback/feedback-dialog/feedback-dialog.component';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { FileTicketModule } from 'app/pages/system/file-ticket/file-ticket.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    IxIconModule,
    MatDialogModule,
    MatButtonModule,
    FileTicketModule,
    ReactiveFormsModule,
    IxFormsModule,
    MatTooltipModule,
    TestIdModule,
    AppLoaderModule,
  ],
  declarations: [
    FeedbackDialogComponent,
  ],
  providers: [
    IxFeedbackService,
  ],
})
export class IxFeedbackModule { }
