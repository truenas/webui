import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { JailsConfigurationComponent } from './configuration/';
import { JailListComponent } from './jail-list/';
import { JailFormComponent } from './jail-form/';
import { StorageListComponent } from './storages/storage-list/';
import { StorageFormComponent } from './storages/storage-form/';
import { TemplateListComponent } from './templates/template-list/';
import { TemplateFormComponent } from './templates/template-form/';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Jails' },
    children: [{
      path: 'jails',
      component: JailListComponent,
      data: { title: 'Instances', breadcrumb: 'INSTANCES'}
    }, {
      path: 'add',
      component: JailFormComponent,
      data: { title: 'Add', breadcrumb: 'ADD' },
    }, {
      path: 'edit/:pk',
      component: JailFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' },
    }, {
      path: 'storage',
      data: { title: 'Storage', breadcrumb: 'STORAGE'},
      children: [{
        path: '',
        component: StorageListComponent,
        data: { title: 'Storage', breadcrumb: 'STORAGE'},
      },{
        path: 'add',
        component: StorageFormComponent,
        data: { title: 'Add', breadcrumb: 'ADD' },
      },
      {
        path: 'edit/:pk',
        component: StorageFormComponent,
        data: { title: 'Edit', breadcrumb: 'EDIT' },
      }]
    }, {
      path: 'configuration',
      component: JailsConfigurationComponent,
      data: { title: 'Configuration', breadcrumb: 'CONFIGURATION' },
    }, {
      path: 'templates',
      data: { title: 'Templates', breadcrumb: 'TEMPLATES'},
      children: [{
        path: '',
        component: TemplateListComponent,
        data: { title: 'Templates', breadcrumb: 'TEMPLATES'},
      },{
        path: 'add',
        component: TemplateFormComponent,
        data: { title: 'Add', breadcrumb: 'ADD' },
      },{
        path: 'edit/:pk',
        component: TemplateFormComponent,
        data: { title: 'Edit', breadcrumb: 'EDIT' },
      }]
    }]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
