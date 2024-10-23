import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { DatasetQuotasListComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quotas-list/dataset-quotas-list.component';
import { DatasetUnlockComponent } from 'app/pages/datasets/modules/encryption/components/dataset-unlock/dataset-unlock.component';
import {
  DatasetAclEditorComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/dataset-acl-editor.component';
import { snapshotsRoutes } from 'app/pages/datasets/modules/snapshots/snapshots.routes';
import { DatasetTrivialPermissionsComponent } from './modules/permissions/containers/dataset-trivial-permissions/dataset-trivial-permissions.component';

const userQuotasData = {
  quotaType: DatasetQuotaType.User,
  quotaObjType: DatasetQuotaType.UserObj,
  helpTextKey: 'users',
};

const groupQuotasData = {
  quotaType: DatasetQuotaType.Group,
  quotaObjType: DatasetQuotaType.GroupObj,
  helpTextKey: 'groups',
};

export const datasetRoutes: Routes = [
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
      ...snapshotsRoutes,
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
            component: DatasetQuotasListComponent,
            data: { title: T('User Quotas'), breadcrumb: null, ...userQuotasData },
          },
          {
            path: 'group-quotas',
            component: DatasetQuotasListComponent,
            data: { title: T('Group Quotas'), breadcrumb: null, ...groupQuotasData },
          },
        ],
      },
      {
        path: 'user-quotas/:pk',
        component: DatasetQuotasListComponent,
        data: { title: T('User Quotas'), breadcrumb: null, ...userQuotasData },
      },
      {
        path: 'group-quotas/:pk',
        component: DatasetQuotasListComponent,
        data: { title: T('Group Quotas'), breadcrumb: null, ...groupQuotasData },
      },
      {
        path: '**',
        redirectTo: '/datasets/',
        pathMatch: 'full',
      },
    ],
  },
];
