import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AllUsersComponent } from 'app/pages/credentials/new-users/all-users/all-users.component';

export const userRoutes: Routes = [
  {
    path: '',
    component: AllUsersComponent,
    data: { title: T('Users'), breadcrumb: T('Users'), isNew: true },
  },
];
