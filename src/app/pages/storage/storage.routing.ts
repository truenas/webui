import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetQuotasGrouplistComponent } from 'app/pages/storage/volumes/datasets/dataset-quotas/dataset-quotas-grouplist/dataset-quotas-grouplist.component';
import { DatasetQuotasUserlistComponent } from 'app/pages/storage/volumes/datasets/dataset-quotas/dataset-quotas-userlist/dataset-quotas-userlist.component';
import { DatasetAclEditorComponent } from 'app/pages/storage/volumes/permissions/containers/dataset-acl-editor/dataset-acl-editor.component';
import { DatasetTrivialPermissionsComponent } from 'app/pages/storage/volumes/permissions/containers/dataset-trivial-permissions/dataset-trivial-permissions.component';
import { ViewEnclosureComponent } from 'app/pages/system/view-enclosure/components/view-enclosure/view-enclosure.component';
import { DiskBulkEditComponent } from './disks/disk-bulk-edit/disk-bulk-edit.component';
import { DiskListComponent } from './disks/disk-list/disk-list.component';
import { SmartResultsComponent } from './disks/smart-results/smart-results.component';
import { ImportDiskComponent } from './import-disk/import-disk.component';
import { VmwareSnapshotListComponent } from './vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.component';
import { DatasetFormComponent } from './volumes/datasets/dataset-form/dataset-form.component';
import { DatasetUnlockComponent } from './volumes/datasets/dataset-unlock/dataset-unlock.component';
import { ManagerComponent } from './volumes/manager/manager.component';
import { VolumeStatusComponent } from './volumes/volume-status/volume-status.component';
import { VolumesListComponent } from './volumes/volumes-list/volumes-list.component';
import { ZvolFormComponent } from './volumes/zvol/zvol-form/zvol-form.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Storage' },
    children: [
      {
        path: '',
        data: { title: 'Storage', breadcrumb: 'Storage', icon: 'view_stream' },
        children: [
          {
            path: '',
            component: VolumesListComponent,
            data: { title: 'Storage', breadcrumb: 'Storage' },
          },
          {
            path: 'id/:volid/dataset/add/:parent',
            component: DatasetFormComponent,
            data: { title: 'Add Dataset', breadcrumb: 'Add Dataset' },
          },
          {
            path: 'id/:volid/dataset/edit/:pk',
            component: DatasetFormComponent,
            data: { title: 'Edit Dataset', breadcrumb: 'Edit Dataset' },
          },
          {
            path: 'id/:pk/zvol/add/:path',
            component: ZvolFormComponent,
            data: { title: 'Add Zvol', breadcrumb: 'Add Zvol' },
          },
          {
            path: 'id/:pk/zvol/edit/:path',
            component: ZvolFormComponent,
            data: { title: 'Edit Zvol', breadcrumb: 'Edit Zvol' },
          },
          {
            path: 'permissions/:pk',
            component: DatasetTrivialPermissionsComponent,
            data: { title: 'Edit Permissions', breadcrumb: 'Edit Permissions' },
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
            path: 'id/:pk/dataset/acl/:path',
            component: DatasetAclEditorComponent,
            data: { title: 'Edit ACL', breadcrumb: 'Edit ACL' },
          },
          {
            path: 'id/:pk/dataset/posix-acl/:path',
            component: DatasetAclEditorComponent,
            data: { title: 'Edit POSIX.1e ACL', breadcrumb: 'Edit POSIX.1e ACL' },
          },
          {
            path: 'id/:pk/dataset/unlock/:path',
            component: DatasetUnlockComponent,
            data: { title: 'Unlock Datasets', breadcrumb: 'Unlock Datasets' },
          },
          {
            path: 'manager',
            component: ManagerComponent,
            data: { title: 'Create Pool', breadcrumb: 'Create Pool' },
          },
          {
            path: 'manager/:pk',
            component: ManagerComponent,
            data: { title: 'Add Vdevs to Pool', breadcrumb: 'Add Vdevs to Pool' },
          },
          {
            path: 'status/:pk',
            component: VolumeStatusComponent,
            data: { title: 'Pool Status', breadcrumb: 'Pool Status' },
          },
        ],
      },
      {
        path: 'snapshots',
        loadChildren: () => import('app/pages/storage/snapshots/snapshots.module').then((module) => module.SnapshotsModule),
        data: { title: 'Snapshots', breadcrumb: 'Snapshots', icon: 'camera_alt' },
      },
      {
        path: 'vmware-snapshots',
        data: { title: 'VMware Snapshots', breadcrumb: 'VMware Snapshots', icon: 'camera_alt' },
        children: [
          {
            path: '',
            component: VmwareSnapshotListComponent,
            data: { title: 'VMware Snapshots', breadcrumb: 'VMware Snapshots' },
          },
        ],
      },
      {
        path: 'disks',
        data: { title: 'Disks', breadcrumb: 'Disks', icon: 'view_stream' },
        children: [
          {
            path: '',
            component: DiskListComponent,
            data: { title: 'Disks', breadcrumb: 'Disks' },
          },
          {
            path: 'bulk-edit',
            component: DiskBulkEditComponent,
            data: { title: 'Bulk Edit Disks', breadcrumb: 'Bulk Edit Disks' },
          },
          {
            path: 'smartresults/:pk',
            component: SmartResultsComponent,
            data: { title: 'S.M.A.R.T. Test Results', breadcrumb: 'S.M.A.R.T. Test Results' },
          },
        ],
      },
      {
        path: 'import-disk',
        component: ImportDiskComponent,
        data: { title: 'Import Disk', breadcrumb: 'Import Disk', icon: 'view_stream' },
      },
      {
        path: 'viewenclosure',
        component: ViewEnclosureComponent,
        data: { title: 'View Enclosure', breadcrumb: 'View Enclosure', icon: 'settings' },
      },
    ],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
