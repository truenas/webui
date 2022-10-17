import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
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
    data: { title: T('Session') },
  },
  {
    path: 'others',
    loadChildren: () => import('./views/others/others.module').then((module) => module.OthersModule),
    data: { title: T('Others'), breadcrumb: T('Others') },
  }],
},
{
  path: '',
  component: AdminLayoutComponent,
  canActivate: [AuthService, TranslationsLoadedGuard],
  children: [{
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then((module) => module.DashboardModule),
    data: { title: T('Dashboard'), breadcrumb: T('Dashboard') },
  },
  {
    path: 'credentials',
    loadChildren: () => import('./pages/account/account.module').then((module) => module.AccountModule),
    data: { title: T('Credentials'), breadcrumb: T('Credentials'), disabled: true },
  },
  {
    path: 'system',
    loadChildren: () => import('./pages/system/system.module').then((module) => module.SystemModule),
    data: { title: T('System'), breadcrumb: T('System'), disabled: true },
  },
  {
    path: 'tasks',
    redirectTo: 'data-protection',
    pathMatch: 'prefix',
  },
  {
    path: 'network',
    loadChildren: () => import('./pages/network/network.module').then((module) => module.NetworkModule),
    data: { title: T('Network'), breadcrumb: T('Network') },
  },
  {
    path: 'services',
    loadChildren: () => import('./pages/services/services.module').then((module) => module.ServicesModule),
    data: { title: T('Services'), breadcrumb: T('Services') },
  },
  {
    path: 'directoryservice',
    loadChildren: () => import('app/pages/directory-service/directory-service.module').then((module) => module.DirectoryServiceModule),
    data: { title: T('Directory Services'), breadcrumb: T('Directory Services') },
  },
  {
    path: 'vm',
    loadChildren: () => import('./pages/vm/vm.module').then((module) => module.VmModule),
    data: { title: T('Virtual Machines'), breadcrumb: T('Virtual Machines') },
  },
  {
    path: 'apps',
    component: ApplicationsComponent,
    data: { title: T('Applications'), breadcrumb: T('Applications') },
  },
  {
    path: 'apps/:tabIndex',
    loadChildren: () => import('./pages/applications/applications.module').then((module) => module.ApplicationsModule),
    data: { title: T('Applications'), breadcrumb: T('Applications') },
  },
  {
    path: 'sharing',
    loadChildren: () => import('./pages/sharing/sharing.module').then((module) => module.SharingModule),
    data: { title: T('Sharing'), breadcrumb: T('Sharing') },
  },
  {
    path: 'datasets',
    loadChildren: () => import('./pages/datasets/datasets.module').then((module) => module.DatasetsModule),
    data: { title: T('Storage'), breadcrumb: T('Storage') },
  },
  {
    path: 'storage',
    loadChildren: () => import('./pages/storage/storage.module').then((module) => module.StorageModule),
    data: { title: T('Storage'), breadcrumb: T('Storage') },
  },
  {
    path: 'reportsdashboard',
    loadChildren: () => import('app/pages/reports-dashboard/reports-dashboard.module').then((module) => module.ReportsDashboardModule),
    data: { title: T('Reporting'), breadcrumb: T('Reporting'), disabled: true },
  },
  {
    path: 'shell',
    loadChildren: () => import('./pages/shell/shell.module').then((module) => module.ShellModule),
    data: { title: T('Shell'), breadcrumb: T('Shell') },
  },
  {
    path: 'apikeys',
    loadChildren: () => import('./pages/api-keys/api-keys.module').then((module) => module.ApiKeysModule),
    data: { title: T('API Keys'), breadcrumb: T('API Keys') },
  },
  {
    path: 'data-protection',
    loadChildren: () => import('./pages/data-protection/data-protection.module').then((module) => module.DataProtectionModule),
    data: { title: T('Data Protection'), breadcrumb: T('Data Protection') },
  },
  {
    path: 'credentials',
    loadChildren: () => import('./pages/credentials/credentials.module').then((module) => module.CredentialsModule),
    data: { title: T('Credentials'), breadcrumb: T('Credentials'), disabled: true },
  },
  {
    path: 'jobs',
    loadChildren: () => import('./pages/jobs/jobs-list.module').then((module) => module.JobsListModule),
    data: { title: T('Jobs'), breadcrumb: T('Jobs') },
  },
  ],
},
{
  path: '**',
  redirectTo: 'dashboard',
  pathMatch: 'full',
},
];
