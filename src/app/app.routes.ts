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
        children: [{
            path: 'users',
            loadChildren: './pages/users/users.module#UsersModule',
            data: { title: 'Users', breadcrumb: 'USERS' }
          },
          {
            path: 'groups',
            loadChildren: './pages/groups/groups.module#GroupsModule',
            data: { title: 'Groups', breadcrumb: 'GROUPS' }
          }
        ]
      },
      {
        path: 'system',
        children: [
          {
            path: 'general',
            loadChildren: 'app/pages/system/general/general.module#SystemGeneralModule',
            data: { title: 'System', breadcrumb: 'General' }
          },
          {
            path: 'advanced',
            loadChildren: 'app/pages/system/advanced/advanced.module#SystemAdvancedModule',
            data: { title: 'System', breadcrumb: 'ADVANCED' }
          },
          {
            path: 'bootenv',
            loadChildren: 'app/pages/system/bootenv/bootenv.module#BootEnvironmentsModule',
            data: { title: 'Boot Environments', breadcrumb: 'BOOTENV' }
          },
          {
            path: 'ca',
            loadChildren: 'app/pages/system/ca/ca.module#CertificateAuthorityModule',
            data: { title: 'System', breadcrumb: 'CA' }
          },
          {
            path: 'certificates',
            loadChildren: 'app/pages/system/certificates/certificate.module#CertificateModule',
            data: { title: 'System', breadcrumb: 'Certificates' }
          },
          {
            path: 'tunable',
            loadChildren: 'app/pages/system/tunable/tunable.module#TunableModule',
            data: { title: 'System', breadcrumb: 'Tunable' }
          },
          {
            path: 'update',
            loadChildren: 'app/pages/system/update/update.module#UpdateModule',
            data: {title: 'Update', breadcrumb: 'UPDATE'},
          },
          {
            path: 'support',
            loadChildren: 'app/pages/system/support/support.module#SupportModule',
            data: {title: 'Support', breadcrumb: 'SUPPORT'},
          },
          {
            path: 'ntpservers',
            loadChildren: 'app/pages/system/ntpservers/ntpservers.module#NTPServersModule',
            data: { title: 'System', breadcrumb: 'NTPServers' }
          },
        ]
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
        data: { title: 'directoryservice', breadcrumb: 'DIRECTORYSERVICE' }
      },
      {
        path: 'vm',
        loadChildren: 'app/pages/vm/vm.module#VmModule',
        data: { title: 'virtualization', breadcrumb: 'VIRTUALIZATION' }
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
        path : 'shell',
        loadChildren : './pages/shell/shell.module#ShellModule',
        data: { title: 'Shell', breadcrumb: 'SHELL'}
      }
    ]
  },
  {
    path: 'reportsdashboard',
    loadChildren: './pages/reportsdashboard/reportsdashboard.module#ReportsDashboardModule',
    data: { title: 'reportsdashboard', breadcrumb: 'REPORTING' }
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
