import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { 
  MatProgressBarModule,
  MatButtonModule,
  MatInputModule,
  MatCardModule,
  MatCheckboxModule,
  MatSnackBarModule,
  MatIconModule,
  MatTooltipModule
 } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';

import { CommonDirectivesModule } from '../../directives/common/common-directives.module';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LockscreenComponent } from './lockscreen/lockscreen.component';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
import { SessionsRoutes } from "./sessions.routing";

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
    MatIconModule,
    MatTooltipModule,
    FlexLayoutModule,
    TranslateModule,
    RouterModule.forChild(SessionsRoutes)
  ],
  declarations: [ForgotPasswordComponent, LockscreenComponent, SigninComponent, SignupComponent]
})
export class SessionsModule { }
