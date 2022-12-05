import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';
import { TrueCommandStatusComponent } from 'app/views/sessions/signin/true-command-status/true-command-status.component';
import { sessionsRoutes } from './sessions.routing';
import { DisconnectedMessageComponent } from './signin/disconnected-message/disconnected-message.component';
import { FailoverStatusComponent } from './signin/failover-status/failover-status.component';
import { SetRootPasswordFormComponent } from './signin/set-root-password-form/set-root-password-form.component';
import { SigninFormComponent } from './signin/signin-form/signin-form.component';
import { SigninComponent } from './signin/signin.component';

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
    IxIconModule,
    FlexLayoutModule,
    TranslateModule,
    RouterModule.forChild(sessionsRoutes),
    CoreComponents,
    IxFormsModule,
    MatInputModule,
    AppCommonModule,
  ],
  declarations: [
    SigninComponent,
    SigninFormComponent,
    SetRootPasswordFormComponent,
    TrueCommandStatusComponent,
    FailoverStatusComponent,
    DisconnectedMessageComponent,
  ],
  providers: [
    SigninStore,
  ],
})
export class SessionsModule { }
