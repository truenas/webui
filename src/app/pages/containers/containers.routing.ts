import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ContainersComingsoonComponent } from './containers-comingsoon/containers-comingsoon.component';

export const routes: Routes = [{
  path: '',
  component: ContainersComingsoonComponent,
  data: { title: 'Containers', breadcrumb: 'Containers' },
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
