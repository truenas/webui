import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ReportsDashboardComponent } from 'app/pages/reports-dashboard/reports-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'cpu',
  },
  {
    path: 'cpu',
    pathMatch: 'full',
    data: { title: T('CPU'), breadcrumb: T('CPU') },
    component: ReportsDashboardComponent,
  },
  {
    path: 'disk',
    pathMatch: 'full',
    data: { title: T('Disk'), breadcrumb: T('Disk') },
    component: ReportsDashboardComponent,
  },
  {
    path: 'memory',
    pathMatch: 'full',
    data: { title: T('Memory'), breadcrumb: T('Memory') },
    component: ReportsDashboardComponent,
  },
  {
    path: 'network',
    pathMatch: 'full',
    data: { title: T('Network'), breadcrumb: T('Network') },
    component: ReportsDashboardComponent,
  },
  {
    path: 'system',
    pathMatch: 'full',
    data: { title: T('System'), breadcrumb: T('System') },
    component: ReportsDashboardComponent,
  },
  {
    path: 'target',
    pathMatch: 'full',
    data: { title: T('Target'), breadcrumb: T('Target') },
    component: ReportsDashboardComponent,
  },
  {
    path: 'ups',
    pathMatch: 'full',
    data: { title: T('UPS'), breadcrumb: T('UPS') },
    component: ReportsDashboardComponent,
  },
  {
    path: 'zfs',
    pathMatch: 'full',
    data: { title: T('ZFS'), breadcrumb: T('ZFS') },
    component: ReportsDashboardComponent,
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
