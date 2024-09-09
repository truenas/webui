import {
  AsyncPipe, DecimalPipe,
} from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { ConfirmDialogComponent } from 'app/modules/dialog/components/confirm-dialog/confirm-dialog.component';
import { ErrorDialogComponent } from 'app/modules/dialog/components/error-dialog/error-dialog.component';
import { FullScreenDialogComponent } from 'app/modules/dialog/components/full-screen-dialog/full-screen-dialog.component';
import { GeneralDialogComponent } from 'app/modules/dialog/components/general-dialog/general-dialog.component';
import { InfoDialogComponent } from 'app/modules/dialog/components/info-dialog/info-dialog.component';
import { JobProgressDialogComponent } from 'app/modules/dialog/components/job-progress/job-progress-dialog.component';
import {
  ErrorTemplateComponent,
} from 'app/modules/dialog/components/multi-error-dialog/error-template/error-template.component';
import { MultiErrorDialogComponent } from 'app/modules/dialog/components/multi-error-dialog/multi-error-dialog.component';
import { RedirectDialogComponent } from 'app/modules/dialog/components/redirect-dialog/redirect-dialog.component';
import {
  SessionExpiringDialogComponent,
} from 'app/modules/dialog/components/session-expiring-dialog/session-expiring-dialog.component';
import { ShowLogsDialogComponent } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import {
  StartServiceDialogComponent,
} from 'app/modules/dialog/components/start-service-dialog/start-service-dialog.component';
import { UpdateDialogComponent } from 'app/modules/dialog/components/update-dialog/update-dialog.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  imports: [
    MatCheckboxModule,
    MatDialogModule,
    FormsModule,
    TranslateModule,
    TestIdModule,
    MatButtonModule,
    IxIconModule,
    MatProgressBarModule,
    MatDividerModule,
    CommonDirectivesModule,
    AppLoaderModule,
    ReactiveFormsModule,
    JobsModule,
    CopyButtonComponent,
    IxSlideToggleComponent,
    FormActionsComponent,
    DecimalPipe,
    AsyncPipe,
  ],
  declarations: [
    ConfirmDialogComponent,
    ErrorDialogComponent,
    FullScreenDialogComponent,
    GeneralDialogComponent,
    InfoDialogComponent,
    JobProgressDialogComponent,
    MultiErrorDialogComponent,
    RedirectDialogComponent,
    SessionExpiringDialogComponent,
    ShowLogsDialogComponent,
    StartServiceDialogComponent,
    UpdateDialogComponent,
    ErrorTemplateComponent,
  ],
  providers: [],
})
export class DialogModule {
}
