import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UserApiKeysComponent } from 'app/pages/credentials/users/user-api-keys/user-api-keys.component';
import { OldUserListComponent } from 'app/pages/credentials/users/user-list/user-list.component';

export const userRoutes: Routes = [
  {
    path: '',
    component: OldUserListComponent,
    data: { title: T('Users'), breadcrumb: T('Users') },
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
];
