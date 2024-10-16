import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ReportingExporterListComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-list/reporting-exporters-list.component';
import { ReportsDashboardComponent } from 'app/pages/reports-dashboard/reports-dashboard.component';

export const reportsDashboardRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'cpu',
  },
  {
    path: 'exporters',
    pathMatch: 'full',
    component: ReportingExporterListComponent,
    data: { title: T('Reporting Exporters'), breadcrumb: T('Reporting Exporters') },
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
