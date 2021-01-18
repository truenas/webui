import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DatasetPermissionsComponent } from './volumes/datasets/dataset-permissions/';
import { DatasetAclComponent } from './volumes/datasets/dataset-acl/';
import { DatasetUnlockComponent } from './volumes/datasets/dataset-unlock/';
import { SnapshotAddComponent } from './snapshots/snapshot-add/';
import { SnapshotCloneComponent } from './snapshots/snapshot-clone/';
import { SnapshotListComponent } from './snapshots/snapshot-list/';
import { DatasetFormComponent } from './volumes/datasets/dataset-form/';
import { ManagerComponent } from './volumes/manager/';
// import { VolumesEditComponent } from './volumes-edit/index';
import { VolumesListComponent } from './volumes/volumes-list/';
import { ZvolFormComponent } from './volumes/zvol/zvol-form/';
import { VMwareSnapshotFormComponent } from './VMware-snapshot/VMware-snapshot';
import { VMwareSnapshotListComponent } from './VMware-snapshot/VMware-snapshot-list';
import { ImportDiskComponent } from './import-disk/import-disk.component';
import { DiskListComponent } from './disks/disk-list/';
import { DiskFormComponent } from './disks/disk-form/';
import { DiskBulkEditComponent } from './disks/disk-bulk-edit';
import { SmartResultsComponent } from './disks/smart-results/smart-results.component';
import { VolumeAddkeyFormComponent } from 'app/pages/storage/volumes/volumeaddkey-form';
import { VolumeRekeyFormComponent } from 'app/pages/storage/volumes/volumerekey-form';
import { VolumeCreatekeyFormComponent } from 'app/pages/storage/volumes/volumecreatekey-form';
import { VolumeChangekeyFormComponent } from 'app/pages/storage/volumes/volumechangekey-form';
import { VolumeImportWizardComponent} from './volumes/volume-import-wizard';
import { VolumeStatusComponent } from './volumes/volume-status';
import { MultipathsComponent } from './multipaths/multipaths.component';
import { DatasetQuotasUserlistComponent } from 'app/pages/storage/volumes/datasets/dataset-quotas/dataset-quotas-userlist/dataset-quotas-userlist.component';
import { DatasetQuotasGrouplistComponent } from 'app/pages/storage/volumes/datasets/dataset-quotas/dataset-quotas-grouplist/dataset-quotas-grouplist.component';
import { UserQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-userlist/user-quota-form/user-quota-form.component';
import { GroupQuotaFormComponent } from './volumes/datasets/dataset-quotas/dataset-quotas-grouplist/group-quota-form/group-quota-form.component';
import { DatasetPosixAclComponent } from './volumes/datasets/dataset-posix-acl/';
import { EntityDashboardComponent } from '../common/entity/entity-dashboard/entity-dashboard.component';
import { ViewEnclosureComponent } from 'app/pages/system/viewenclosure/view-enclosure.component';
import { ZvolWizardComponent } from './volumes/zvol/zvol-wizard';

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
            path: '', component: VolumesListComponent,
            data: { title: 'Storage', breadcrumb: 'Storage' }
          },
          {
            path: 'id/:volid/dataset/add/:parent', component: DatasetFormComponent,
            data: { title: 'Add Dataset', breadcrumb: 'Add Dataset' }
          },
          {
            path: 'id/:volid/dataset/edit/:pk', component: DatasetFormComponent,
            data: { title: 'Edit Dataset', breadcrumb: 'Edit Dataset' }
          },
          {
            path: 'id/:pk/zvol/add/:path', component: ZvolFormComponent,
            data: { title: 'Add Zvol', breadcrumb: 'Add Zvol' }
          },
          {
            path: 'id/:pk/zvol/edit/:path', component: ZvolFormComponent,
            data: { title: 'Edit Zvol', breadcrumb: 'Edit Zvol' }
          },
          {
            path: 'permissions/:pk', component: DatasetPermissionsComponent,
            data: { title: 'Edit Permissions', breadcrumb: 'Edit Permissions' }
          },
          {
            path: 'user-quotas/:pk', component: DatasetQuotasUserlistComponent,
            data: { title: 'User Quotas', breadcrumb: 'User Quotas' },
          },
          {
            path: 'user-quotas-form/:pk', component: UserQuotaFormComponent,
            data: { title: 'Set User Quotas', breadcrumb: 'Set User Quotas'}
          },
          {
            path: 'group-quotas/:pk', component: DatasetQuotasGrouplistComponent,
            data: { title: 'Edit Group Quotas', breadcrumb: 'Edit Group Quotas' }
          },
          {
            path: 'group-quotas-form/:pk', component: GroupQuotaFormComponent,
            data: { title: 'Set Group Quotas', breadcrumb: 'Set Group Quotas'}
          },
          {
            path: 'id/:pk/dataset/acl/:path', component: DatasetAclComponent,
            data: { title: 'Edit ACL', breadcrumb: 'Edit ACL' }
          },
          {
            path: 'id/:pk/dataset/posix-acl/:path', component: DatasetPosixAclComponent,
            data: { title: 'Edit POSIX.1e ACL', breadcrumb: 'Edit POSIX.1e ACL' }
          },
          {
            path: 'id/:pk/dataset/unlock/:path', component: DatasetUnlockComponent,
            data: { title: 'Unlock Datasets', breadcrumb: 'Unlock Datasets' }
          },
          {
            path: 'manager', component: ManagerComponent,
            data: { title: 'Create Pool', breadcrumb: 'Create Pool' }
          },
          {
            path: 'manager/:pk', component: ManagerComponent,
            data: { title: 'Add Vdevs to Pool', breadcrumb: 'Add Vdevs to Pool' }
          },
          {
            path: 'import', component: VolumeImportWizardComponent,
            data: { title: 'Import Pool', breadcrumb: 'Import Pool' }
          },
          {
            path: 'status/:pk', component: VolumeStatusComponent,
            data: { title: 'Pool Status', breadcrumb: 'Pool Status' }
          },
          {
            path: 'rekey/:pk', component: VolumeRekeyFormComponent,
            data: { title: 'Reset Keys', breadcrumb: 'Reset Keys' }
          },
          {
            path: 'addkey/:pk', component: VolumeAddkeyFormComponent,
            data: { title: 'Recovery Key', breadcrumb: 'Recovery Key' }
          },
          {
            path: 'createkey/:pk', component: VolumeCreatekeyFormComponent,
            data: { title: 'Encryption Key', breadcrumb: 'Encryption Key' }
          },
          {
            path: 'changekey/:pk', component: VolumeChangekeyFormComponent,
            data: { title: 'Encryption Key', breadcrumb: 'Encryption Key' }
          }
        ]
      },
      {
        path: 'snapshots',
        data: { title: 'Snapshots', breadcrumb: 'Snapshots', icon: 'camera_alt' },
        children: [
          {
            path: '', component: SnapshotListComponent,
            data: { title: 'Snapshots', breadcrumb: 'Snapshots' }
          },
          {
            path: 'clone/:pk', component: SnapshotCloneComponent,
            data: { title: 'Clone', breadcrumb: 'Clone' }
          },
          {
            path: 'add', component: SnapshotAddComponent,
            data: { title: 'Add', breadcrumb: 'Add' }
          }
        ]
      },
      {
        path: 'vmware-Snapshots',
        data: { title: 'VMware Snapshots', breadcrumb: 'VMware Snapshots', icon: 'camera_alt' },
        children: [
          {
            path: '', component: VMwareSnapshotListComponent,
            data: { title: 'VMware Snapshots', breadcrumb: 'VMware Snapshots' }
          },
          {
            path: 'add', component: VMwareSnapshotFormComponent,
            data: { title: 'Add', breadcrumb: 'Add' }
          },
          {
            path: 'edit/:pk', component: VMwareSnapshotFormComponent,
            data: { title: 'Edit', breadcrumb: 'Edit' }
          }

        ]
      },
      {
        path: 'disks',
        data: { title: 'Disks', breadcrumb: 'Disks', icon: 'view_stream' },
        children: [
          {
            path: '', component: DiskListComponent,
            data: { title: 'Disks', breadcrumb: 'Disks' }
          },
          {
            path: 'edit/:pk', component: DiskFormComponent,
            data: { title: 'Edit Disk', breadcrumb: 'Edit Disk' }
          },
          {
            path: 'bulk-edit', component: DiskBulkEditComponent,
            data: { title: 'Bulk Edit Disks', breadcrumb: 'Bulk Edit Disks' }
          },
          {
            path: 'pool/:poolId/edit/:pk', component: DiskFormComponent,
            data: { title: 'Edit Pool Disk', breadcrumb: 'Edit Pool Disk' }
          },
          {
            path: 'smartresults/:pk', component: SmartResultsComponent,
            data: { title: 'S.M.A.R.T. Test Results', breadcrumb: 'S.M.A.R.T. Test Results'}
          }
        ]
      },
      {
        path: 'multipaths',
        data: { title: 'Multipaths', breadcrumb: 'Multipaths', icon: 'view_stream' },
        component: MultipathsComponent,
      },
      {
        path: 'import-disk', component: ImportDiskComponent,
        data: { title: 'Import Disk', breadcrumb: 'Import Disk', icon: 'view_stream' }
      },
      {
        path: 'viewenclosure',
        component: ViewEnclosureComponent,
        data: { title: 'View Enclosure', breadcrumb: 'View Enclosure', icon: 'settings' },
      },
    ]
  }
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
