import { ModuleWithProviders} from '@angular/core';
import { RouterModule, Routes} from '@angular/router';

import { DatasetPermissionsComponent} from './volumes/datasets/dataset-permissions/'
import { SnapshotAddComponent} from './snapshots/snapshot-add/';
import { SnapshotCloneComponent} from './snapshots/snapshot-clone/';
import { SnapshotListComponent} from './snapshots/snapshot-list/';
import { SnapshotRollbackComponent} from './snapshots/snapshot-rollback/';
import { DatasetFormComponent} from './volumes/datasets/dataset-form/';
import { DatasetDeleteComponent} from './volumes/datasets/dataset-delete/';
import { ManagerComponent} from './volumes/manager/';
// import { VolumesEditComponent } from './volumes-edit/index';
import {VolumeDeleteComponent} from './volumes/volume-delete/index';
import {VolumesListComponent} from './volumes/volumes-list/';
import {ZvolAddComponent} from './volumes/zvol/zvol-add/';
import {ZvolDeleteComponent} from './volumes/zvol/zvol-delete/';
import {ZvolEditComponent} from './volumes/zvol/zvol-edit/';
import {VolumeImportListComponent} from './volumes/import-list/';
import {VMwareSnapshotFormComponent} from './VMware-snapshot/VMware-snapshot';
import {VMwareSnapshotListComponent} from './VMware-snapshot/VMware-snapshot-list';
import {ImportDiskComponent} from './import-disk/import-disk.component';
import { StatusComponent } from './volumes/status/status.component';
import { DisksListComponent } from './disks/disks-list/';
import { DiskFormComponent } from './disks/disk-form/';
import { DiskWipeComponent } from './disks/disk-wipe/disk-wipe.component';
import { VolumeUnlockFormComponent } from 'app/pages/storage/volumes/volumeunlock-form/volumeunlock-form.component';
import { VolumeRekeyFormComponent } from 'app/pages/storage/volumes/volumerekey-form';

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
          data: {title: 'Edit Permissions', breadcrumb: 'Edit Permissions' }},
        {
          path : 'id/:pk/zvol/delete/:path', component : ZvolDeleteComponent,
          data: {title: 'Delete Zvol', breadcrumb:'Delete Zvol' }},
        {
          path : 'manager', component : ManagerComponent,
          data: {title: 'Create Pool', breadcrumb:'Create Pool' }},
        {
          path : 'manager/:pk', component : ManagerComponent,
          data: {title: 'Extend Pool', breadcrumb: 'Extend Pool' }
        },
        {
          path : 'import_list', component: VolumeImportListComponent,
          data: {title: 'Import Volume', breadcrumb:'Import Volume' }},
        {
          path: 'status/:pk', component: StatusComponent,
          data: {title: 'Scrub Status', breadcrumb:'Scrub Status' }},
        {
          path : 'delete/:pk', component : VolumeDeleteComponent,
          data: {title: 'Delete Volume', breadcrumb:'Delete Volume' }},
        {
          path : 'unlock/:pk', component : VolumeUnlockFormComponent,
          data: {title: 'Unlock Volume', breadcrumb:'Unlock Volume' }},
        {
            path : 'rekey/:pk', component : VolumeRekeyFormComponent,
            data: {title: 'Rekey Volume', breadcrumb:'Rekey Volume' }},
        {
              path : 'addkey/:pk', component : VolumeRekeyFormComponent,
              data: {title: 'Rekey Volume', breadcrumb:'Add Key Volume' }}
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
      },
      {
        path: 'disks',
        data: {title: 'disks', breadcrumb: 'disks'},
        children: [
          {
            path : '', component: DisksListComponent,
            data: {title: 'View Disks', breadcrumb:'View Disks' }},
          {
            path : 'edit/:pk', component : DiskFormComponent,
            data: {title: 'Edit Disk', breadcrumb:'Edit Disk' }},
          {
            path : 'wipe/:pk', component : DiskWipeComponent,
            data: {title: 'Wipe Disk', breadcrumb:'Wipe Disk' }}
        ]
      },
      {
        path: 'import-disk', component : ImportDiskComponent,
        data: {title: 'Import Disk', breadcrumb: 'Import Disk'}
      },
    ]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
