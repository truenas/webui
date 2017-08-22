import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { 
  MdProgressBarModule,
  MdButtonModule,
  MdInputModule,
  MdCardModule,
  MdCheckboxModule
 } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';

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
    MdProgressBarModule,
    MdButtonModule,
    MdInputModule,
    MdCardModule,
    MdCheckboxModule,
    FlexLayoutModule,
    RouterModule.forChild(SessionsRoutes)
  ],
  declarations: [ForgotPasswordComponent, LockscreenComponent, SigninComponent, SignupComponent]
})
export class SessionsModule { }