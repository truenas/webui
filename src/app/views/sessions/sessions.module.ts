import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import {
  DisconnectedMessageComponent,
} from 'app/views/sessions/signin/disconnected-message/disconnected-message.component';
import {
  TrueCommandStatusComponent,
} from 'app/views/sessions/signin/true-command-status/true-command-status.component';
import { sessionsRoutes } from './sessions.routing';
import { SigninComponent } from './signin/signin.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatCheckboxModule,
    MatSnackBarModule,
    IxIconModule,
    MatTooltipModule,
    FlexLayoutModule,
    TranslateModule,
    RouterModule.forChild(sessionsRoutes),
    CoreComponents,
    AppCommonModule,
  ],
  declarations: [
    SigninComponent,
    DisconnectedMessageComponent,
    TrueCommandStatusComponent,
  ],
})
export class SessionsModule { }
