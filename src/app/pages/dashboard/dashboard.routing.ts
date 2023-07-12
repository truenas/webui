import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { DashboardComponent } from 'app/pages/dashboard/components/dashboard/dashboard.component';

export const routes: Routes = [{
  path: '',
  pathMatch: 'full',
  component: DashboardComponent,
  data: {
    title: T('Dashboard'),
    breadcrumb: T('Dashboard'),
  },
}];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
