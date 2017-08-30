import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdvancedComponent } from './'


export const routes: Routes = [
  { path: '', component: AdvancedComponent, pathMatch: 'full' },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
