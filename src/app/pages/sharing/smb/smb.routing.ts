import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SMBFormComponent } from './smb-form/';
// import { SMBDeleteComponent } from './smb-delete/index';
import { SMBListComponent } from './smb-list/';

export const routes: Routes = [
  {path : '', component : SMBListComponent},
  {path : 'add', component : SMBFormComponent},
  {path : 'edit/:pk', component : SMBFormComponent},
  // {path : 'delete/:pk', component : SMBDeleteComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);