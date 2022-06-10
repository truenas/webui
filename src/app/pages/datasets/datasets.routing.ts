import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
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
        component: DatasetsManagementComponent,
        data: { title: 'Datasets Management', breadcrumb: 'Datasets Management' },
      },
      {
        path: 'permissions',
        children: [
          {
            path: 'edit/:path',
            component: DatasetTrivialPermissionsComponent,
            data: { title: 'Edit Permissions', breadcrumb: 'Edit Permissions' },
          },
          {
            path: 'acl/:path',
            component: DatasetAclEditorComponent,
            data: { title: 'Edit ACL', breadcrumb: 'Edit ACL' },
          },
        ],
      },
    ],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
