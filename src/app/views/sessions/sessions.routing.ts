import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SigninComponent } from './signin/signin.component';

export const sessionsRoutes: Routes = [
  {
    path: '',
    children: [{
      path: 'signin',
      component: SigninComponent,
      data: { title: T('Signin') },
    }],
  },
];
