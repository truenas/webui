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
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
