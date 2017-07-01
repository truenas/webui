import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {JailsConfigurationComponent} from './configuration/';
import {JailDeleteComponent} from './jail-delete/';
import {JailFormComponent} from './jail-form/';
import {JailListComponent} from './jail-list/';
import {StorageDeleteComponent} from './storages/storage-delete/';
import {StorageFormComponent} from './storages/storage-form/';
import {StorageListComponent} from './storages/storage-list/';
import {TemplateDeleteComponent} from './templates/template-delete/';
import {TemplateFormComponent} from './templates/template-form/';
import {TemplateListComponent} from './templates/template-list/';

export const routes: Routes = [
  {path : 'jails', component : JailListComponent, pathMatch : 'full'},
  {path : 'add', component : JailFormComponent},
  {path : 'edit/:pk', component : JailFormComponent},
  {path : 'delete/:pk', component : JailDeleteComponent},
  {path : 'storage', component : StorageListComponent},
  {path : 'storage/add', component : StorageFormComponent},
  {path : 'storage/edit/:pk', component : StorageFormComponent},
  {path : 'storage/delete/:pk', component : StorageDeleteComponent},
  {path : 'configuration', component : JailsConfigurationComponent},
  {path : 'templates', component : TemplateListComponent},
  {path : 'templates/add', component : TemplateFormComponent},
  {path : 'templates/delete/:pk', component : TemplateDeleteComponent},
  {path : 'templates/edit/:pk', component : TemplateFormComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
