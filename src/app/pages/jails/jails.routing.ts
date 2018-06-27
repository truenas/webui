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
      data: { title: 'Jails', breadcrumb: 'Jails'},
      children: [
        {
          path: '',
          component: JailListComponent
        },
        {
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
          data: { title: 'Mount Points', breadcrumb: 'Mount Points' },
          children: [
            {
              path: '',
              component: StorageListComponent,
            }, {
              path: 'add',
              component: StorageFormComponent,
              data: { title: 'Add', breadcrumb: 'Add' },
            }, {
              path: 'edit/:pk',
              component: StorageFormComponent,
              data: { title: 'Edit', breadcrumb: 'Edit' },
            },
          ]
        }, {
          path: 'wizard',
          component: JailWizardComponent,
          data: { title: 'Wizard', breadcrumb: 'Wizard'},
        }
      ]
    }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
