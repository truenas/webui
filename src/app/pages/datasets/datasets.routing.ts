import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { DatasetQuotasGrouplistComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quotas-grouplist/dataset-quotas-grouplist.component';
import { DatasetQuotasUserlistComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quotas-userlist/dataset-quotas-userlist.component';
import { DatasetUnlockComponent } from 'app/pages/datasets/modules/encryption/components/dataset-unlock/dataset-unlock.component';
import {
  DatasetAclEditorComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/dataset-acl-editor.component';
import { DatasetTrivialPermissionsComponent } from './modules/permissions/containers/dataset-trivial-permissions/dataset-trivial-permissions.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Datasets', breadcrumb: 'Datasets' },
    children: [
      {
        path: '',
        redirectTo: '/datasets/',
        pathMatch: 'full',
      },
      {
        path: 'acl/edit',
        component: DatasetAclEditorComponent,
        data: { title: 'Edit ACL', breadcrumb: null },
        pathMatch: 'full',
      },
      {
        path: ':datasetId',
        data: { breadcrumb: null },
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: DatasetsManagementComponent,
            data: { title: 'Datasets', breadcrumb: null },
          },
          {
            path: 'permissions/edit',
            component: DatasetTrivialPermissionsComponent,
            data: { title: 'Edit Permissions', breadcrumb: null },
          },
          {
            path: 'unlock',
            component: DatasetUnlockComponent,
            data: { title: 'Unlock Datasets', breadcrumb: 'Unlock Datasets' },
          },
          {
            path: 'user-quotas',
            component: DatasetQuotasUserlistComponent,
            data: { title: 'User Quotas', breadcrumb: 'User Quotas' },
          },
          {
            path: 'group-quotas',
            component: DatasetQuotasGrouplistComponent,
            data: { title: 'Group Quotas', breadcrumb: 'Edit Group Quotas' },
          },
        ],
      },
      {
        path: 'user-quotas/:pk',
        component: DatasetQuotasUserlistComponent,
        data: { title: 'User Quotas', breadcrumb: 'User Quotas' },
      },
      {
        path: 'group-quotas/:pk',
        component: DatasetQuotasGrouplistComponent,
        data: { title: 'Group Quotas', breadcrumb: 'Edit Group Quotas' },
      },
      {
        path: '**',
        redirectTo: '/datasets/',
        pathMatch: 'full',
      },
    ],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
