import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AllUsersComponent } from 'app/pages/credentials/new-users/all-users/all-users.component';
import { DemoComponent } from 'app/pages/credentials/new-users/demo/demo.component';

export const userRoutes: Routes = [{
  path: '',
  data: { title: T('Users (WIP)'), breadcrumb: null },
  children: [
    {
      path: '',
      component: AllUsersComponent,
    },
    {
      path: 'demo',
      component: DemoComponent,
    },
    {
      path: 'view/:id',
      data: { title: T('Users (WIP)'), breadcrumb: null },
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
