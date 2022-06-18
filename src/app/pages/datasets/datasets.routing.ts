import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { DatasetUnlockComponent } from 'app/pages/datasets/modules/encryption/components/dataset-unlock/dataset-unlock.component';
import {
  DatasetAclEditorComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/dataset-acl-editor.component';
import { DatasetTrivialPermissionsComponent } from './modules/permissions/containers/dataset-trivial-permissions/dataset-trivial-permissions.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Dataset Management' },
    children: [
      {
        path: '',
        redirectTo: '/datasets/',
        pathMatch: 'full',
      },
      {
        path: ':datasetId',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: DatasetsManagementComponent,
            data: { title: 'Datasets Management', breadcrumb: 'Datasets Management' },
          },
          {
            path: 'permissions/edit',
            component: DatasetTrivialPermissionsComponent,
            data: { title: 'Edit Permissions', breadcrumb: 'Edit Permissions' },
          },
          {
            path: 'permissions/acl',
            component: DatasetAclEditorComponent,
            data: { title: 'Edit ACL', breadcrumb: 'Edit ACL' },
          },
          {
            path: 'unlock',
            component: DatasetUnlockComponent,
            data: { title: 'Unlock Datasets', breadcrumb: 'Unlock Datasets' },
          },
        ],
      },
    ],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
