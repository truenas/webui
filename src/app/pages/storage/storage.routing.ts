import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {DatasetPermissionsComponent} from './volumes/datasets/dataset-permissions/'
import {SnapshotAddComponent} from './snapshots/snapshot-add/';
import {SnapshotCloneComponent} from './snapshots/snapshot-clone/';
import {SnapshotListComponent} from './snapshots/snapshot-list/';
import {SnapshotRollbackComponent} from './snapshots/snapshot-rollback/';
import {DatasetFormComponent} from './volumes/datasets/dataset-form/';
import {DatasetDeleteComponent} from './volumes/datasets/dataset-delete/';
import {ManagerComponent} from './volumes/manager/';
// import { VolumesEditComponent } from './volumes-edit/index';
import {VolumeDeleteComponent} from './volumes/volume-delete/index';
import {VolumesListComponent} from './volumes/volumes-list/';
import {ZvolAddComponent} from './volumes/zvol/zvol-add/';
import {ZvolDeleteComponent} from './volumes/zvol/zvol-delete/';
import {ZvolEditComponent} from './volumes/zvol/zvol-edit/';
import {VolumeImportListComponent} from './volumes/import-list/';
import {VMwareSnapshotFormComponent} from './VMware-snapshot/VMware-snapshot';
import {VMwareSnapshotListComponent} from './VMware-snapshot/VMware-snapshot-list';
import { SnapshotEditComponent } from 'app/pages/storage/snapshots/snapshot-edit/snapshot-edit.component';

export const routes: Routes = [
  {
    path : '', 
    data: {title:'Storage'},
    children: [
      { path: 'volumes',
        data: {title: 'Volumes', breadcrumb: 'Volumes'},
        children: [
        {
          path: '', component : VolumesListComponent,
          data: {title: 'Volumes', breadcrumb: 'Volumes'}
        },
        {
          path : 'id/:volid/dataset/add/:parent', component : DatasetFormComponent,
          data: {title: 'Add Dataset', breadcrumb:'Add Dataset' }},
        {
          path : 'id/:volid/dataset/edit/:pk', component : DatasetFormComponent,
          data: {title: 'Edit Dataset', breadcrumb:'Edit Dataset' }},
        {
          path : 'id/:pk/zvol/add/:path', component : ZvolAddComponent,
          data: {title: 'Add Zvol', breadcrumb:'Add Zvol' }},
        {
          path : 'id/:pk/zvol/edit/:path', component : ZvolEditComponent,
          data: {title: 'Edit Zvol', breadcrumb:'Edit Zvol' }},
        {
          path : 'id/:pk/dataset/delete/:path', component : DatasetDeleteComponent,
          data: {title: 'Delete Dataset', breadcrumb:'Delete Dataset' }},
        {
          path : 'id/:pk/dataset/permissions/:path', component: DatasetPermissionsComponent,
          data: {title: 'Edit Permissions', breadcrumb: 'Edit Permissions' }
        },
        {
          path : 'id/:pk/zvol/delete/:path', component : ZvolDeleteComponent,
          data: {title: 'Delete Zvol', breadcrumb:'Delete Zvol' }},
        {
          path : 'manager', component : ManagerComponent,
          data: {title: 'Volume Manager', breadcrumb:'Volume Manager' }},
        {
          path : 'import_list', component: VolumeImportListComponent,
          data: {title: 'Import Volume', breadcrumb:'Import Volume' }},
        //{ path: 'edit/:pk', component: VolumesEditComponent },
        {
          path : 'delete/:pk', component : VolumeDeleteComponent,
          data: {title: 'Delete Volume', breadcrumb:'Delete Volume' }},
      ]},
      {
        path: 'snapshots',
        data: {title: 'Snapshots', breadcrumb: 'Snapshots'},
        children: [
          {
            path : '', component : SnapshotListComponent,
            data: {title: 'Snapshots', breadcrumb:'Snapshots' }},
          {
            path : 'clone/:pk', component : SnapshotCloneComponent,
            data: {title: 'Clone', breadcrumb:'Clone' }},
          {
            path : 'rollback/:pk', component : SnapshotRollbackComponent,
            data: {title: 'Rollback', breadcrumb:'Rollback' }},
          {
            path : 'edit/:pk', component : SnapshotEditComponent,
            data: {title: 'Edit', breadcrumb:'Edit' }},
            {
              path : 'add', component : SnapshotAddComponent,
              data: {title: 'Add', breadcrumb:'Add' }}
        ]
      },
      {
        path: 'vmware-Snapshots',
        data: {title: 'vmware-Snapshots', breadcrumb: 'vmware-Snapshots'},
        children: [
          {
            path : '', component : VMwareSnapshotListComponent,
            data: {title: 'vmware-Snapshots', breadcrumb:'vmware-Snapshots' }},
          {
            path : 'add', component : VMwareSnapshotFormComponent,
            data: {title: 'Add', breadcrumb:'Add' }},
            {
              path : 'edit/:pk', component : VMwareSnapshotFormComponent,
              data: {title: 'Edit', breadcrumb:'Edit' }}

        ]
      }
    ]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
