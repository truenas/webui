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
            path: 'ntpservers',
            loadChildren: 'app/pages/system/ntpservers/ntpservers.module#NTPServersModule',
            data: { title: 'System', breadcrumb: 'NTPServers' }
          },
        ]
      },
      {
        path:'network',
        loadChildren: 'app/pages/network/network.module#NetworkModule',
        data: { title: 'Network', breadcrumb: 'NETWORK' }
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
        children: [{
            path: 'afp',
            loadChildren: './pages/sharing/afp/afp.module#AFPModule',
            data: { title: 'AFP', breadcrumb: 'AFP' },
          },
          {
            path: 'nfs',
            loadChildren: './pages/sharing/nfs/nfs.module#NFSModule',
            data: { title: 'NFS', breadcrumb: 'NFS' },
          },
          {
            path: 'webdav',
            loadChildren: './pages/sharing/webdav/webdav.module#WebdavModule',
            data: { title: 'WebDAV', breadcrumb: 'WebDAV' },
          },
          {
            path: 'smb',
            loadChildren: './pages/sharing/smb/smb.module#SMBModule',
            data: { title: 'SMB', breadcrumb: 'SMB' },
          },
          {
            path: 'iscsi',
            loadChildren: './pages/sharing/iscsi/iscsi.module#ISCSIModule',
            data: { title: 'ISCSI', breadcrumb: 'ISCSI' },
          }
        ]
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
