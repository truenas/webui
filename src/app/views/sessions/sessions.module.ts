import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
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
    LayoutModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatButtonModule,
    MatInputModule,
    MatRadioModule,
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
