import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GeneralComponent } from './';
import { ConfigSaveComponent } from './config-save/';
import { ConfigUploadComponent } from './config-upload/';


export const routes: Routes = [
  { path: 'config-save', component: ConfigSaveComponent },
  { path: 'config-upload', component: ConfigUploadComponent },
  { path: '', component: GeneralComponent, pathMatch: 'full' },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
