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
        data: { title: 'Dashboard', breadcrumb: 'Dashboard' }
      },
      {
        path: 'credentials',
        loadChildren: './pages/account/account.module#AccountModule',
        data: { title: 'Credentials', breadcrumb: 'Credentials'}
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
        data: { title: 'Services', breadcrumb: 'Services', toplevel:true }
      },
      {
        path: 'directoryservice',
        loadChildren: 'app/pages/directoryservice/directoryservice.module#DirectoryServiceModule',
        data: { title: 'Directory Services', breadcrumb: 'Directory Services' }
      },
      {
        path: 'vm',
        loadChildren: 'app/pages/vm/vm.module#VmModule',
        data: { title: 'Virtual Machines', breadcrumb: 'Virtual Machines', toplevel:true }
      },
      {
        path: 'containers',
        loadChildren: 'app/pages/containers/containers.module#ContainersModule',
        data: { title: 'Containers', breadcrumb: 'Containers' }
      },
      {
        path: 'clustering',
        loadChildren: 'app/pages/clustering/clustering.module#ClusteringModule',
        data: { title: 'Clustering', breadcrumb: 'Clustering' }
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
        path: 'plugins',
        loadChildren: './pages/plugins/plugins.module#PluginsModule',
        data: { title: 'Plugins', breadcrumb: 'Plugins', toplevel: true },
      },
      { // Listing partially updated for new 12.1 menu - TODO Move components, finish update ////////////////
        path: 'virtualization',
        loadChildren: './pages/jails/jails.module#JailsModule',
        data: { title: 'Jails', breadcrumb: 'Jails', toplevel: true },
      },
      {
        path: 'reportsdashboard',
        loadChildren: './pages/reportsdashboard/reportsdashboard.module#ReportsDashboardModule',
        data: { title: 'Reporting', breadcrumb: 'Reporting' }
      },
      {
        path: 'systemprocesses',
        loadChildren : 'app/pages/systemprocesses/system-processes.module#SystemProcessesModule',
        data: { title: 'System Processes', breadcrumb: 'System Processes'}
      },
      {
        path : 'shell',
        loadChildren : './pages/shell/shell.module#ShellModule',
        data: { title: 'Shell', breadcrumb: 'Shell'}
      },
      {
        path : 'guide',
        loadChildren : './pages/guide/guide.module#GuideModule',
        data: { title: 'Guide', breadcrumb: 'Guide'}
      },
      {
        path : 'ui-preferences',
        loadChildren : './pages/preferences/preferences.module#PreferencesModule',
        data: { title: 'Web Interface Preferences', breadcrumb: 'Preferences'}
      },
      {
        path : 'apikeys',
        loadChildren : './pages/api-keys/api-keys.module#ApiKeysModule',
        data: { title: 'API Keys', breadcrumb: 'API Keys'}
      },
      {
        path : 'data-protection',
        loadChildren : './pages/data-protection/data-protection.module#DataProtectionModule',
        data: { title: 'Data Protection', breadcrumb: 'Data Protection'}
      },
      {
        path : 'credentials',
        loadChildren : './pages/credentials/credentials.module#CredentialsModule',
        data: { title: 'Credentials', breadcrumb: 'Credentials'}
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
