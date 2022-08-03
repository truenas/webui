import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { JiraOauthComponent } from 'app/pages/system/file-ticket/file-ticket-form/components/jira-oauth/jira-oauth.component';
import { FileTicketFormComponent } from 'app/pages/system/file-ticket/file-ticket-form/file-ticket-form.component';
import { FileTicketLicensedFormComponent } from 'app/pages/system/file-ticket/file-ticket-licensed-form/file-ticket-licensed-form.component';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    IxFormsModule,
    JobsModule,
    TranslateModule,
    TooltipModule,
    IxIconModule,
  ],
  declarations: [
    FileTicketFormComponent,
    FileTicketLicensedFormComponent,
    JiraOauthComponent,
  ],
  exports: [
    FileTicketFormComponent,
    FileTicketLicensedFormComponent,
  ],
})
export class FileTicketModule {}
