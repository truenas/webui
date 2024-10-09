import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslationsLoadedGuard } from 'app/core/guards/translations-loaded.guard';
import { WebSocketConnectionGuard } from 'app/core/guards/websocket-connection.guard';
import { AdminLayoutComponent } from 'app/modules/layout/admin-layout/admin-layout.component';
import { BlankLayoutComponent } from 'app/modules/layout/blank-layout/blank-layout.component';
import { SigninComponent } from 'app/pages/signin/signin.component';
import { TwoFactorGuardService } from 'app/services/auth/two-factor-guard.service';
import { AuthGuardService } from './services/auth/auth-guard.service';

export const rootRouterConfig: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: BlankLayoutComponent,
    canActivate: [TranslationsLoadedGuard, WebSocketConnectionGuard],
    children: [
      {
        path: 'signin',
        component: SigninComponent,
        data: { title: T('Signin') },
      },
      {
        path: 'system-tasks',
        loadChildren: () => import('app/pages/system-tasks/system-tasks.module').then((module) => module.SystemTasksModule),
        data: { title: T('Others'), breadcrumb: T('Others') },
      },
    ],
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuardService, TranslationsLoadedGuard, WebSocketConnectionGuard],
    canActivateChild: [TwoFactorGuardService],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('app/pages/dashboard/dashboard.module').then((module) => module.DashboardModule),
        data: { title: T('Dashboard'), breadcrumb: T('Dashboard') },
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
        loadComponent: () => import('./pages/network/network.component').then((module) => module.NetworkComponent),
        data: { title: T('Network'), breadcrumb: T('Network') },
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/services/services.component').then((module) => module.ServicesComponent),
        data: { title: T('Services'), breadcrumb: T('Services') },
      },
      {
        path: 'directoryservice',
        loadChildren: () => import('app/pages/directory-service/directory-service.routes').then((module) => module.routes),
        data: { title: T('Directory Services'), breadcrumb: T('Directory Services') },
      },
      {
        path: 'vm',
        loadChildren: () => import('app/pages/vm/vm.routes').then((module) => module.vmRoutes),
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
        data: { title: T('Shares'), breadcrumb: T('Shares') },
      },
      {
        path: 'datasets',
        loadChildren: () => import('./pages/datasets/datasets.module').then((module) => module.DatasetsModule),
        data: { title: T('Datasets'), breadcrumb: T('Datasets') },
      },
      {
        path: 'storage',
        loadChildren: () => import('./pages/storage/storage.routes').then((module) => module.storageRoutes),
        data: { title: T('Storage'), breadcrumb: T('Storage') },
      },
      {
        path: 'reportsdashboard',
        loadChildren: () => import('app/pages/reports-dashboard/reports-dashboard.module').then((module) => module.ReportsDashboardModule),
        data: { title: T('Reporting'), breadcrumb: T('Reporting') },
      },
      {
        path: 'shell',
        loadComponent: () => import('./pages/shell/shell.component').then((module) => module.ShellComponent),
        data: { title: T('Shell'), breadcrumb: T('Shell') },
      },
      {
        path: 'apikeys',
        loadComponent: () => import('./pages/api-keys/api-keys.component').then((module) => module.ApiKeysComponent),
        data: { title: T('API Keys'), breadcrumb: T('API Keys') },
      },
      {
        path: 'two-factor-auth',
        loadChildren: () => import('./pages/two-factor-auth/two-factor-auth.module').then((module) => module.TwoFactorAuthModule),
        data: { title: T('Two-Factor Authentication'), breadcrumb: T('Two-Factor Authentication') },
      },
      {
        path: 'data-protection',
        loadChildren: () => import('./pages/data-protection/data-protection.module').then((module) => module.DataProtectionModule),
        data: { title: T('Data Protection'), breadcrumb: T('Data Protection') },
      },
      {
        path: 'credentials',
        loadChildren: () => import('app/pages/credentials/credentials.routes').then((module) => module.credentialsRoutes),
        data: { title: T('Credentials'), breadcrumb: T('Credentials') },
      },
      {
        path: 'jobs',
        loadChildren: () => import('./pages/jobs/jobs-list.module').then((module) => module.JobsListModule),
        data: { title: T('Jobs'), breadcrumb: T('Jobs') },
      },
      {
        path: 'system/audit',
        loadChildren: () => import('./pages/audit/audit.routes').then((module) => module.auditRoutes),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
