import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClusteringComingsoonComponent } from './clustering-comingsoon/clustering-comingsoon.component';

export const routes: Routes = [{
  path: '',
  component: ClusteringComingsoonComponent,
  data: { title: 'Clustering', breadcrumb: 'Clustering' },
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
