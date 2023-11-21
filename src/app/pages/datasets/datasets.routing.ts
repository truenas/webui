import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
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
    data: { title: T('Datasets'), breadcrumb: null },
    children: [
      {
        path: '',
        redirectTo: '/datasets/',
        pathMatch: 'full',
      },
      {
        path: 'acl/edit',
        component: DatasetAclEditorComponent,
        data: { title: T('Edit ACL'), breadcrumb: null },
        pathMatch: 'full',
      },
      {
        path: ':datasetId',
        data: { breadcrumb: T('Datasets') },
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: DatasetsManagementComponent,
            data: { title: T('Datasets'), breadcrumb: null },
          },
          {
            path: 'permissions/edit',
            component: DatasetTrivialPermissionsComponent,
            data: { title: T('Edit Permissions'), breadcrumb: null },
          },
          {
            path: 'unlock',
            component: DatasetUnlockComponent,
            data: { title: T('Unlock Datasets'), breadcrumb: null },
          },
          {
            path: 'user-quotas',
            component: DatasetQuotasUserlistComponent,
            data: { title: T('User Quotas'), breadcrumb: null },
          },
          {
            path: 'group-quotas',
            component: DatasetQuotasGrouplistComponent,
            data: { title: T('Group Quotas'), breadcrumb: null },
          },
        ],
      },
      {
        path: 'user-quotas/:pk',
        component: DatasetQuotasUserlistComponent,
        data: { title: T('User Quotas'), breadcrumb: null },
      },
      {
        path: 'group-quotas/:pk',
        component: DatasetQuotasGrouplistComponent,
        data: { title: T('Group Quotas'), breadcrumb: null },
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
