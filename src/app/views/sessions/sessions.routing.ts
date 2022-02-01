import { Routes } from '@angular/router';
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
    }],
  },
];
