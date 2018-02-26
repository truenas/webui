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
      path: 'others',
      loadChildren: './views/others/others.module#OthersModule',
      data: { title: 'Others', breadcrumb: 'Others'}
    }]
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthService],
    children: [{
        path: 'dashboard',
        loadChildren: './pages/dashboard/dashboard.module#DashboardModule',
        data: { title: 'DASHBOARD', breadcrumb: 'DASHBOARD' }
      },
      {
        path: 'account',
        loadChildren: './pages/account/account.module#AccountModule',
        data: { title: 'ACCOUNT', breadcrumb: 'ACCOUNT'}
      },
      {
        path: 'system',
        loadChildren: './pages/system/system.module#SystemModule',
        data: { title: 'SYSTEM', breadcrumb: 'SYSTEM'}
      },
      {
        path: 'tasks',
        loadChildren: './pages/task-calendar/task-calendar.module#TaskCalendarModule',
        data: { title: 'TASKS', breadcrumb: 'TASKS'}
      },
      {
        path:'network',
        loadChildren: 'app/pages/network/network.module#NetworkModule',
        data: { title: 'NETWORK', breadcrumb: 'NETWORK' }
      },
      {
        path:'services',
        loadChildren: 'app/pages/services/services.module#ServicesModule',
        data: { title: 'SERVICES', breadcrumb: 'SERVICES' }
      },
      {
        path: 'directoryservice',
        loadChildren: 'app/pages/directoryservice/directoryservice.module#DirectoryServiceModule',
        data: { title: 'DIRECTORY_SERVICE', breadcrumb: 'DIRECTORY_SERVICE' }
      },
      {
        path: 'vm',
        loadChildren: 'app/pages/vm/vm.module#VmModule',
        data: { title: 'VIRTUAL_MACHINES', breadcrumb: 'VIRTUAL_MACHINES' }
      },
      {
        path: 'sharing',
        loadChildren: 'app/pages/sharing/sharing.module#SharingModule',
        data: { title: 'SHARING', breadcrumb: 'SHARING'}
      },
      {
        path: 'storage',
        loadChildren: './pages/storage/storage.module#StorageModule',
        data: { title: 'STORAGE', breadcrumb: 'STORAGE' }
      },
      {
        path: 'plugins',
        loadChildren: './pages/plugins/plugins.module#PluginsModule',
        data: { title: 'PLUGINS', breadcrumb: 'PLUGINS' },
      },
      {
        path: 'jails',
        loadChildren: './pages/jails/jails.module#JailsModule',
        data: { title: 'JAILS', breadcrumb: 'JAILS' },
      },
      {
        path: 'reportsdashboard',
        loadChildren: './pages/reportsdashboard/reportsdashboard.module#ReportsDashboardModule',
        data: { title: 'REPORTING', breadcrumb: 'REPORTING' }
      },
      {
        path: 'systemprocesses',
        loadChildren : 'app/pages/systemprocesses/system-processes.module#SystemProcessesModule',
        data: { title: 'SYSTEM_PROCESSES', breadcrumb: 'SYSTEM_PROCESSES'}
      },
      {
        path : 'shell',
        loadChildren : './pages/shell/shell.module#ShellModule',
        data: { title: 'SHELL', breadcrumb: 'SHELL'}
      },
      {
        path : 'guide',
        loadChildren : './pages/guide/guide.module#GuideModule',
        data: { title: 'GUIDE', breadcrumb: 'GUIDE'}
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
