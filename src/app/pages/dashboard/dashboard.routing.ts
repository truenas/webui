import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from 'app/pages/dashboard/components/dashboard/dashboard.component';

export const routes: Routes = [{
  path: '',
  pathMatch: 'full',
  component: DashboardComponent,
}];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
