import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { JailsConfigurationComponent } from './configuration/';
// import { JailDeleteComponent } from './jail-delete/';
import { JailListComponent } from './jail-list/';
import { JailFormComponent } from './jail-form/';
// import { StorageDeleteComponent } from './storages/storage-delete/';
import { StorageListComponent } from './storages/storage-list/';
import { StorageFormComponent } from './storages/storage-form/';
// import { TemplateDeleteComponent } from './templates/template-delete/';
import { TemplateListComponent } from './templates/template-list/';
import { TemplateFormComponent } from './templates/template-form/';

export const routes: Routes = [
  { path : 'jails', component : JailListComponent, pathMatch : 'full' },
  { path : 'add', component : JailFormComponent },
  { path : 'edit/:pk', component : JailFormComponent },
  // { path : 'delete/:pk', component : JailDeleteComponent },
  { path : 'storage', component : StorageListComponent },
  { path : 'storage/add', component : StorageFormComponent },
  { path : 'storage/edit/:pk', component : StorageFormComponent },
  // { path : 'storage/delete/:pk', component : StorageDeleteComponent },
  { path : 'configuration', component : JailsConfigurationComponent },
  { path : 'templates', component : TemplateListComponent },
  { path : 'templates/add', component : TemplateFormComponent },
  { path : 'templates/edit/:pk', component : TemplateFormComponent },
  // { path : 'templates/delete/:pk', component : TemplateDeleteComponent },

];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
