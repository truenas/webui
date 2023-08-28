import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServicesComponent } from './services.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ServicesComponent,
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
