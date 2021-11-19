import { Routes } from '@angular/router';
import { LockScreenComponent } from 'app/views/sessions/lock-screen/lock-screen.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';

export const sessionsRoutes: Routes = [
  {
    path: '',
    children: [{
      path: 'signup',
      component: SignupComponent,
      data: { title: 'Signup' },
    }, {
      path: 'signin',
      component: SigninComponent,
      data: { title: 'Signin' },
    }, {
      path: 'forgot-password',
      component: ForgotPasswordComponent,
      data: { title: 'Forgot password' },
    }, {
      path: 'lockscreen',
      component: LockScreenComponent,
      data: { title: 'Lockscreen' },
    }],
  },
];
