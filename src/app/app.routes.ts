import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslationsLoadedGuard } from 'app/core/guards/translations-loaded.guard';
import { WebsocketConnectionGuard } from 'app/core/guards/websocket-connection.guard';
import { AdminLayoutComponent } from 'app/modules/layout/components/admin-layout/admin-layout.component';
import { TwoFactorGuardService } from 'app/services/auth/two-factor-guard.service';
import { AuthLayoutComponent } from './modules/layout/components/auth-layout/auth-layout.component';
import { AuthGuardService } from './services/auth/auth-guard.service';

export const rootRouterConfig: Routes = [{
  path: '',
  redirectTo: 'dashboard',
  pathMatch: 'full',
},
{
  path: '',
  component: AuthLayoutComponent,
  canActivate: [TranslationsLoadedGuard, WebsocketConnectionGuard],
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
  canActivate: [AuthGuardService, TranslationsLoadedGuard, WebsocketConnectionGuard],
  canActivateChild: [TwoFactorGuardService],
  children: [{
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then((module) => module.DashboardModule),
    data: { title: T('Dashboard'), breadcrumb: T('Dashboard') },
  },
  {
    path: 'credentials',
    loadChildren: () => import('./pages/account/account.module').then((module) => module.AccountModule),
    data: { title: T('Credentials'), breadcrumb: T('Credentials') },
  },
  {
    path: 'system',
    loadChildren: () => import('./pages/system/system.module').then((module) => module.SystemModule),
    data: { title: T('System'), breadcrumb: T('System') },
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
    loadChildren: () => import('app/pages/apps/apps.module').then((module) => module.AppsModule),
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
    data: { title: T('Reporting'), breadcrumb: T('Reporting') },
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
    path: 'two-factor-auth',
    loadChildren: () => import('./pages/two-factor-auth/two-factor-auth.module').then((module) => module.default),
    data: { title: T('Two-Factor Authentication'), breadcrumb: T('Two-Factor Authentication') },
  },
  {
    path: 'data-protection',
    loadChildren: () => import('./pages/data-protection/data-protection.module').then((module) => module.DataProtectionModule),
    data: { title: T('Data Protection'), breadcrumb: T('Data Protection') },
  },
  {
    path: 'credentials',
    loadChildren: () => import('./pages/credentials/credentials.module').then((module) => module.CredentialsModule),
    data: { title: T('Credentials'), breadcrumb: T('Credentials') },
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
