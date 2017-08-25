import {Routes} from '@angular/router';

import {AdminLayoutComponent} from './components/common/layouts/admin-layout/admin-layout.component';
import {AuthLayoutComponent} from './components/common/layouts/auth-layout/auth-layout.component';

import {AuthService} from './services/auth/auth.service';

export const rootRouterConfig: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'sessions',
        loadChildren: './views/sessions/sessions.module#SessionsModule',
        data: {title: 'Session'}
      }
    ]
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthService],
    children: [
      {
        path: 'dashboard',
        loadChildren: './pages/dashboard/dashboard.module#DashboardModule',
        data: {title: 'Dashboard', breadcrumb: 'DASHBOARD'}
      },
      {
        path: 'account',
        children: [
          {
            path: 'users',
            loadChildren: './pages/users/users.module#UsersModule',
            data: {title: 'Users', breadcrumb: 'USERS'}
          },
          {
            path: 'groups',
            loadChildren: './pages/groups/groups.module#GroupsModule',
            data: {title: 'Groups', breadcrumb: 'GROUPS'}
          }
        ]
      },
      {
        path: 'system',
        children: [
          {
            path: '',
            loadChildren: './pages/system/system.module#SystemModule',
            data: {title: 'Systems', breadcrumb: 'ADVANCED'}
          }
        ]
      },
      {
        path: 'sharing',
        children: [
          {
            path: 'afp',
            loadChildren: './pages/sharing/afp/afp.module#AFPModule',
            data: {title: 'AFP', breadcrumb: 'AFP'},
          },
          {
            path: 'nfs',
            loadChildren: './pages/sharing/nfs/nfs.module#NFSModule',
            data: {title: 'NFS', breadcrumb: 'NFS'},
          }
        ]
      },
      {
        path: 'reportsdashboard',
        loadChildren: './pages/reportsdashboard/reportsdashboard.module#ReportsDashboardModule',
        data: {title: 'reportsdashboard', breadcrumb: 'REPORTING'}
      }
    ]
  },
  {
    path: 'reportsdashboard',
    loadChildren: './pages/reportsdashboard/reportsdashboard.module#ReportsDashboardModule',
    data: {title: 'reportsdashboard', breadcrumb: 'REPORTING'}
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

