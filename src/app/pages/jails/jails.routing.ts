import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { JailListComponent } from './jail-list/';
import { JailFormComponent } from './jail-form/jail-form.component';
import { StorageListComponent } from './storages/storage-list/';
import { StorageFormComponent } from './storages/storage-form/';
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
          data: { title: 'Add', breadcrumb: 'Add' },
          children: [
            {
              path: '',
              redirectTo: 'wizard',
            },
            {
              path: 'advanced',
              component: JailFormComponent,
              data: { title: 'Advanced Jail Creation', breadcrumb: 'Advanced Jail Creation' },
            },
            {
              path: 'wizard',
              component: JailWizardComponent,
              data: { title: 'Wizard', breadcrumb: 'Wizard'},
            }
          ]
        }, {
          path: 'edit/:pk',
          component: JailFormComponent,
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
        }
      ]
    }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
