import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { JailListComponent } from './jail-list/';
import { StorageListComponent } from './storages/storage-list/';
import { StorageFormComponent } from './storages/storage-form/';
import { JailAddComponent } from './jail-add/';
import { JailEditComponent } from './jail-edit/';
import { JailWizardComponent } from './jail-wizard/';
import { JailShellComponent } from './jail-shell/';

export const routes: Routes = [
    {
      path: '',
      component: JailListComponent,
      data: { title: 'Instances', breadcrumb: 'Instances'}
    }, {
      path: 'add',
      component: JailAddComponent,
      data: { title: 'Add', breadcrumb: 'Add' },
    }, {
      path: 'edit/:pk',
      component: JailEditComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' },
    }, {
      path: 'shell/:pk',
      component: JailShellComponent,
      data: { title: 'Shell', breadcrumb: 'Shell' },
    }, {
      path: 'storage/:jail',
      component: StorageListComponent,
      data: { title: 'Mount Points', breadcrumb: 'Mount Points' },
    }, {
      path: 'storage/add/:jail',
      component: StorageFormComponent,
      data: { title: 'Add', breadcrumb: 'Add' },
    }, {
      path: 'storage/edit/:jail/:pk',
      component: StorageFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' },
    },
    {
      path: 'wizard',
      component: JailWizardComponent,
      data: { title: 'Wizard', breadcrumb: 'Wizard'},
    }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
