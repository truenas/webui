import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {SMBAddComponent} from './smb-add/';
import {SMBDeleteComponent} from './smb-delete/index';
import {SMBEditComponent} from './smb-edit/index';
import {SMBListComponent} from './smb-list/';

export const routes: Routes = [
  {path : '', component : SMBListComponent},
  {path : 'add', component : SMBAddComponent},
  {path : 'edit/:pk', component : SMBEditComponent},
  {path : 'delete/:pk', component : SMBDeleteComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
