import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { JailListComponent } from './jail-list/';
import { JailAddComponent } from './jail-add/';
import { JailEditComponent } from './jail-edit/';
import { JailDeleteComponent } from './jail-delete/';
import { StorageListComponent } from './storages/storage-list/';
import { StorageAddComponent } from './storages/storage-add/';
import { StorageDeleteComponent } from './storages/storage-delete/';
import { StorageEditComponent } from './storages/storage-edit/';
import { JailsConfigurationComponent } from './configuration/';
import { TemplateListComponent } from './templates/template-list/';
import { TemplateAddComponent } from './templates/template-add/';
import { TemplateDeleteComponent } from './templates/template-delete/';
import { TemplateEditComponent } from './templates/template-edit/';

export const routes: Routes = [
  	{ path: 'jails', component: JailListComponent, pathMatch: 'full' },  
  	{ path: 'add', component: JailAddComponent},
	{ path: 'edit/:pk', component: JailEditComponent},
	{ path: 'delete/:pk', component: JailDeleteComponent},
	{ path: ':pk/storages', component: StorageListComponent},
	{ path: ':pk/storages/add', component: StorageAddComponent},
	{ path: ':jail/storages/delete/:pk', component: StorageDeleteComponent},
	{ path: ':jail/storages/edit/:pk', component: StorageEditComponent},
	{ path: 'configuration', component: JailsConfigurationComponent},
	{ path: 'templates', component: TemplateListComponent},
	{ path: 'templates/add', component: TemplateAddComponent},
	{ path: 'templates/delete/:pk', component: TemplateDeleteComponent},
	{ path: 'templates/edit/:pk', component: TemplateEditComponent};
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
