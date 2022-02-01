import { Routes } from '@angular/router';
import { TranslationsLoadedGuard } from 'app/core/guards/translations-loaded.guard';
import { ApplicationsComponent } from 'app/pages/applications//applications.component';
import { AdminLayoutComponent } from './components/common/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './components/common/layouts/auth-layout/auth-layout.component';
import { AuthService } from './services/auth/auth.service';

export const rootRouterConfig: Routes = [{
  path: '',
  redirectTo: 'dashboard',
  pathMatch: 'full',
},
{
  path: '',
  component: AuthLayoutComponent,
  canActivate: [TranslationsLoadedGuard],
  children: [{
    path: 'sessions',
    loadChildren: () => import('./views/sessions/sessions.module').then((module) => module.SessionsModule),
    data: { title: 'Session' },
  },
  {
    path: 'others',
    loadChildren: () => import('./views/others/others.module').then((module) => module.OthersModule),
    data: { title: 'Others', breadcrumb: 'Others' },
  }],
},
{
  path: '',
  component: AdminLayoutComponent,
  canActivate: [AuthService, TranslationsLoadedGuard],
  children: [{
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then((module) => module.DashboardModule),
    data: { title: 'Dashboard', breadcrumb: 'Dashboard' },
  },
  {
    path: 'credentials',
    loadChildren: () => import('./pages/account/account.module').then((module) => module.AccountModule),
    data: { title: 'Credentials', breadcrumb: 'Credentials' },
  },
  {
    path: 'system',
    loadChildren: () => import('./pages/system/system.module').then((module) => module.SystemModule),
    data: { title: 'System', breadcrumb: 'System' },
  },
  {
    path: 'tasks',
    redirectTo: 'data-protection',
  },
  {
    path: 'network',
    loadChildren: () => import('./pages/network/network.module').then((module) => module.NetworkModule),
    data: { title: 'Network', breadcrumb: 'Network' },
  },
  {
    path: 'services',
    loadChildren: () => import('./pages/services/services.module').then((module) => module.ServicesModule),
    data: { title: 'Services', breadcrumb: 'Services', toplevel: true },
  },
  {
    path: 'directoryservice',
    loadChildren: () => import('app/pages/directory-service/directory-service.module').then((module) => module.DirectoryServiceModule),
    data: { title: 'Directory Services', breadcrumb: 'Directory Services' },
  },
  {
    path: 'vm',
    loadChildren: () => import('./pages/vm/vm.module').then((module) => module.VmModule),
    data: { title: 'Virtual Machines', breadcrumb: 'Virtual Machines', toplevel: true },
  },
  {
    path: 'apps',
    component: ApplicationsComponent,
    data: { title: 'Applications', breadcrumb: 'Applications', toplevel: true },
  },
  {
    path: 'apps/:tabIndex',
    loadChildren: () => import('./pages/applications/applications.module').then((module) => module.ApplicationsModule),
    data: { title: 'Applications', breadcrumb: 'Applications', toplevel: true },
  },
  {
    path: 'sharing',
    loadChildren: () => import('./pages/sharing/sharing.module').then((module) => module.SharingModule),
    data: { title: 'Sharing', breadcrumb: 'Sharing' },
  },
  {
    path: 'storage',
    loadChildren: () => import('./pages/storage/storage.module').then((module) => module.StorageModule),
    data: { title: 'Storage', breadcrumb: 'Storage', toplevel: true },
  },
  {
    path: 'reportsdashboard',
    loadChildren: () => import('app/pages/reports-dashboard/reports-dashboard.module').then((module) => module.ReportsDashboardModule),
    data: { title: 'Reporting', breadcrumb: 'Reporting' },
  },
  {
    path: 'shell',
    loadChildren: () => import('./pages/shell/shell.module').then((module) => module.ShellModule),
    data: { title: 'Shell', breadcrumb: 'Shell' },
  },
  {
    path: 'ui-preferences',
    loadChildren: () => import('./pages/preferences/preferences.module').then((module) => module.PreferencesModule),
    data: { title: 'Web Interface Preferences', breadcrumb: 'Preferences' },
  },
  {
    path: 'apikeys',
    loadChildren: () => import('./pages/api-keys/api-keys.module').then((module) => module.ApiKeysModule),
    data: { title: 'API Keys', breadcrumb: 'API Keys' },
  },
  {
    path: 'data-protection',
    loadChildren: () => import('./pages/data-protection/data-protection.module').then((module) => module.DataProtectionModule),
    data: { title: 'Data Protection', breadcrumb: 'Data Protection' },
  },
  {
    path: 'credentials',
    loadChildren: () => import('./pages/credentials/credentials.module').then((module) => module.CredentialsModule),
    data: { title: 'Credentials', breadcrumb: 'Credentials' },
  },
  {
    path: 'jobs',
    loadChildren: () => import('./pages/jobs/jobs.module').then((module) => module.JobsModule),
    data: { title: 'Jobs', breadcrumb: 'Jobs' },
  },
  ],
},
{
  path: '**',
  redirectTo: 'dashboard',
  pathMatch: 'full',
},
];
