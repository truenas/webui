import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AllUsersComponent } from 'app/pages/credentials/users/all-users/all-users.component';
import { UserApiKeysComponent } from 'app/pages/credentials/users/user-api-keys/user-api-keys.component';

export const userRoutes: Routes = [{
  path: '',
  data: { title: T('Users'), breadcrumb: null },
  children: [
    {
      path: '',
      component: AllUsersComponent,
    },
    {
      path: 'api-keys',
      component: UserApiKeysComponent,
      data: {
        title: T('User API Keys'),
        breadcrumb: null,
        icon: 'group',
      },
    },
    {
      path: 'view/:id',
      data: { title: T('Users'), breadcrumb: null },
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: AllUsersComponent,
        },
      ],
    },
  ],
}];
