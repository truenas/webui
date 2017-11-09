import { Routes } from '@angular/router';

import { AdminLayoutComponent } from './components/common/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './components/common/layouts/auth-layout/auth-layout.component';

import { AuthService } from './services/auth/auth.service';

export const rootRouterConfig: Routes = [{
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [{
      path: 'sessions',
      loadChildren: './views/sessions/sessions.module#SessionsModule',
      data: { title: 'Session' }
    },
    {
      path: 'reboot',
      loadChildren: './views/others/others.module#OthersModule',
      data: { title: 'System Rebooting', breadcrumb: 'System Rebooting'}
    }]
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthService],
    children: [{
        path: 'dashboard',
        loadChildren: './pages/dashboard/dashboard.module#DashboardModule',
        data: { title: 'Dashboard', breadcrumb: 'DASHBOARD' }
      },
      {
        path: 'account',
        loadChildren: './pages/account/account.module#AccountModule',
        data: { title: 'Account', breadcrumb: 'Account'}
      },
      {
        path: 'system',
        loadChildren: './pages/system/system.module#SystemModule',
        data: { title: 'System', breadcrumb: 'System'}
      },
      {
        path: 'tasks',
        loadChildren: './pages/task-calendar/task-calendar.module#TaskCalendarModule',
        data: { title: 'Tasks', breadcrumb: 'Tasks'}
      },
      {
        path:'network',
        loadChildren: 'app/pages/network/network.module#NetworkModule',
        data: { title: 'Network', breadcrumb: 'Network' }
      },
      {
        path:'services',
        loadChildren: 'app/pages/services/services.module#ServicesModule',
        data: { title: 'Services', breadcrumb: 'Services' }
      },
      {
        path: 'directoryservice',
        loadChildren: 'app/pages/directoryservice/directoryservice.module#DirectoryServiceModule',
        data: { title: 'directoryservice', breadcrumb: 'Directory Service' }
      },
      {
        path: 'vm',
        loadChildren: 'app/pages/vm/vm.module#VmModule',
        data: { title: 'Virtual Machines', breadcrumb: 'Virtual Machines' }
      },
      {
        path: 'sharing',
        loadChildren: 'app/pages/sharing/sharing.module#SharingModule',
        data: { title: 'Sharing', breadcrumb: 'Sharing'}
      },
      {
        path: 'storage',
        loadChildren: './pages/storage/storage.module#StorageModule',
        data: { title: 'Storage', breadcrumb: 'Storage' }
      },
      {
        path: 'jails',
        loadChildren: './pages/jails/jails.module#JailsModule',
        data: { title: 'Jails', breadcrumb: 'Jails' },
      },
      {
        path: 'reportsdashboard',
        loadChildren: './pages/reportsdashboard/reportsdashboard.module#ReportsDashboardModule',
        data: { title: 'reportsdashboard', breadcrumb: 'REPORTING' }
      },
      {
        path: 'systemprocesses',
        loadChildren : 'app/pages/systemprocesses/system-processes.module#SystemProcessesModule',
        data: { title: 'System Processes', breadcrumb: 'System Processes'}
      },
      {
        path : 'shell',
        loadChildren : './pages/shell/shell.module#ShellModule',
        data: { title: 'Shell', breadcrumb: 'SHELL'}
      },
      {
        path : 'guide',
        loadChildren : './pages/guide/guide.module#GuideModule',
        data: { title: 'Guide', breadcrumb: 'Guide'}
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
