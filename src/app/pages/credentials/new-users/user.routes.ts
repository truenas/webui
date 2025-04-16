import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AllUsersComponent } from 'app/pages/credentials/new-users/all-users/all-users.component';
import { DemoComponent } from 'app/pages/credentials/new-users/demo/demo.component';
import { Demo2Component } from 'app/pages/credentials/new-users/demo2/demo2.component';
import { UsersStore } from 'app/pages/credentials/new-users/store/users.store';

export const userRoutes: Routes = [{
  path: '',
  data: { title: T('Users (WIP)'), breadcrumb: null },
  providers: [
    UsersStore,
  ],
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
      path: 'demo2',
      component: Demo2Component,
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
