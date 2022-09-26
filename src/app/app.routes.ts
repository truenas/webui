import { Routes } from '@angular/router';
import { TranslationsLoadedGuard } from 'app/core/guards/translations-loaded.guard';
import { ApplicationsComponent } from 'app/pages/applications//applications.component';
import { AdminLayoutComponent } from './modules/common/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './modules/common/layouts/auth-layout/auth-layout.component';
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
    data: { title: 'Credentials', breadcrumb: 'Credentials', disabled: true },
  },
  {
    path: 'system',
    loadChildren: () => import('./pages/system/system.module').then((module) => module.SystemModule),
    data: { title: 'System', breadcrumb: 'System', disabled: true },
  },
  {
    path: 'tasks',
    redirectTo: 'data-protection',
    pathMatch: 'prefix',
  },
  {
    path: 'network',
    loadChildren: () => import('./pages/network/network.module').then((module) => module.NetworkModule),
    data: { title: 'Network', breadcrumb: 'Network' },
  },
  {
    path: 'services',
    loadChildren: () => import('./pages/services/services.module').then((module) => module.ServicesModule),
    data: { title: 'Services', breadcrumb: 'Services' },
  },
  {
    path: 'directoryservice',
    loadChildren: () => import('app/pages/directory-service/directory-service.module').then((module) => module.DirectoryServiceModule),
    data: { title: 'Directory Services', breadcrumb: 'Directory Services' },
  },
  {
    path: 'vm',
    loadChildren: () => import('./pages/vm/vm.module').then((module) => module.VmModule),
    data: { title: 'Virtual Machines', breadcrumb: 'Virtual Machines' },
  },
  {
    path: 'apps',
    component: ApplicationsComponent,
    data: { title: 'Applications', breadcrumb: 'Applications' },
  },
  {
    path: 'apps/:tabIndex',
    loadChildren: () => import('./pages/applications/applications.module').then((module) => module.ApplicationsModule),
    data: { title: 'Applications', breadcrumb: 'Applications' },
  },
  {
    path: 'sharing',
    loadChildren: () => import('./pages/sharing/sharing.module').then((module) => module.SharingModule),
    data: { title: 'Sharing', breadcrumb: 'Sharing' },
  },
  {
    path: 'datasets',
    loadChildren: () => import('./pages/datasets/datasets.module').then((module) => module.DatasetsModule),
    data: { title: 'Storage', breadcrumb: 'Storage' },
  },
  {
    path: 'storage',
    loadChildren: () => import('./pages/storage/storage.module').then((module) => module.StorageModule),
    data: { title: 'Storage', breadcrumb: 'Storage' },
  },
  {
    path: 'reportsdashboard',
    loadChildren: () => import('app/pages/reports-dashboard/reports-dashboard.module').then((module) => module.ReportsDashboardModule),
    data: { title: 'Reporting', breadcrumb: 'Reporting', disabled: true },
  },
  {
    path: 'shell',
    loadChildren: () => import('./pages/shell/shell.module').then((module) => module.ShellModule),
    data: { title: 'Shell', breadcrumb: 'Shell' },
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
    data: { title: 'Credentials', breadcrumb: 'Credentials', disabled: true },
  },
  {
    path: 'jobs',
    loadChildren: () => import('./pages/jobs/jobs-list.module').then((module) => module.JobsListModule),
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
