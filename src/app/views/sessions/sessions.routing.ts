import { Routes } from '@angular/router';
import { SigninComponent } from './signin/signin.component';

export const sessionsRoutes: Routes = [
  {
    path: '',
    children: [{
      path: 'signin',
      component: SigninComponent,
      data: { title: 'Signin' },
    }],
  },
];
