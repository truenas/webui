import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GeneralComponent } from './';
import { ConfigSaveComponent } from './config-save/'


export const routes: Routes = [
  { path: 'config-save', component: ConfigSaveComponent },
  { path: '', component: GeneralComponent, pathMatch: 'full' },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
