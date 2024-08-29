import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';

import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { SetAdminPasswordFormComponent } from 'app/views/sessions/signin/set-admin-password-form/set-admin-password-form.component';
import { InsecureConnectionComponent } from 'app/views/sessions/signin/snackbar/insecure-connection.component';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';
import { TrueCommandStatusComponent } from 'app/views/sessions/signin/true-command-status/true-command-status.component';
import { sessionsRoutes } from './sessions.routing';
import { DisconnectedMessageComponent } from './signin/disconnected-message/disconnected-message.component';
import { FailoverStatusComponent } from './signin/failover-status/failover-status.component';
import { SigninFormComponent } from './signin/signin-form/signin-form.component';
import { SigninComponent } from './signin/signin.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';

@NgModule({
  imports: [
    CommonModule,
    LayoutModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatProgressBarModule,
    MatRadioModule,
    MatButtonModule,
    MatSnackBarModule,
    IxIconModule,
    TranslateModule,
    RouterModule.forChild(sessionsRoutes),
    MatInputModule,
    CommonDirectivesModule,
    TestIdModule,
    NgxSkeletonLoaderModule,
    MapValuePipe,
    IxInputComponent,
    IxRadioGroupComponent,
  ],
  declarations: [
    SigninComponent,
    SigninFormComponent,
    SetAdminPasswordFormComponent,
    TrueCommandStatusComponent,
    FailoverStatusComponent,
    DisconnectedMessageComponent,
    InsecureConnectionComponent,
  ],
  providers: [
    SigninStore,
  ],
})
export class SessionsModule { }
