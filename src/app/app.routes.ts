import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslationsLoadedGuard } from 'app/modules/language/translations/translations-loaded.guard';
import { BlankLayoutComponent } from 'app/modules/layout/blank-layout/blank-layout.component';
import { WebSocketConnectionGuard } from 'app/modules/websocket/websocket-connection.guard';
import { SigninComponent } from 'app/pages/signin/signin.component';

export const rootRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: BlankLayoutComponent,
    canActivate: [TranslationsLoadedGuard, WebSocketConnectionGuard],
    children: [
      {
        path: 'signin',
        component: SigninComponent,
        data: { title: T('Signin') },
      },
      {
        path: 'system-tasks',
        loadChildren: () => import('app/pages/system-tasks/system-tasks.routes').then((module) => module.systemTasksRoutes),
        data: { title: T('Others'), breadcrumb: T('Others') },
      },
    ],
  },
  {
    path: '',
    loadChildren: () => import('app/admin.routes').then((module) => module.adminRoutes),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
