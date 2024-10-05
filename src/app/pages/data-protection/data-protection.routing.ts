import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  CloudBackupListComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.component';
import { DataProtectionDashboardComponent } from 'app/pages/data-protection/data-protection-dashboard.component';
import { RsyncTaskListComponent } from 'app/pages/data-protection/rsync-task/rsync-task-list/rsync-task-list.component';
import { ScrubListComponent } from 'app/pages/data-protection/scrub-task/scrub-list/scrub-list.component';
import { SmartTaskListComponent } from 'app/pages/data-protection/smart-task/smart-task-list/smart-task-list.component';
import { SnapshotTaskListComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-list/snapshot-task-list.component';
import { VmwareSnapshotListComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.component';
import { CloudSyncListComponent } from './cloudsync/cloudsync-list/cloudsync-list.component';
import { ReplicationListComponent } from './replication/replication-list/replication-list.component';
import { ReplicationWizardComponent } from './replication/replication-wizard/replication-wizard.component';
import { ResilverConfigComponent } from './scrub-task/resilver-config/resilver-config.component';

export const dataProtectionRoutes: Routes = [{
  path: '',
  data: { title: T('Data Protection') },
  children: [
    {
      path: '',
      component: DataProtectionDashboardComponent,
    },
    {
      path: 'cloudsync',
      data: { title: T('Cloud Sync Tasks'), breadcrumb: null },
      children: [{
        path: '',
        component: CloudSyncListComponent,
        data: { title: T('Cloud Sync Tasks'), breadcrumb: null },
      }, {
        path: ':dataset',
        component: CloudSyncListComponent,
        data: { title: T('Cloud Sync Tasks'), breadcrumb: null },
      }],
    },
    {
      path: 'snapshot',
      data: { title: T('Periodic Snapshot Tasks'), breadcrumb: null },
      children: [{
        path: '',
        component: SnapshotTaskListComponent,
        data: { title: T('Periodic Snapshot Tasks'), breadcrumb: null },
      }],
    },
    {
      path: 'snapshot/:dataset',
      data: { title: T('Periodic Snapshot Tasks'), breadcrumb: null },
      children: [{
        path: '',
        component: SnapshotTaskListComponent,
        data: { title: T('Periodic Snapshot Tasks'), breadcrumb: null },
      }],
    },
    {
      path: 'replication',
      data: { title: T('Replication Tasks'), breadcrumb: null },
      children: [{
        path: '',
        component: ReplicationListComponent,
        data: { title: T('Replication Tasks'), breadcrumb: null },
      }, {
        path: ':dataset',
        component: ReplicationListComponent,
        data: { title: T('Replication Tasks'), breadcrumb: null },
      }, {
        path: 'wizard',
        component: ReplicationWizardComponent,
        data: { title: T('Wizard'), breadcrumb: null },
      },
      ],
    },
    {
      path: 'rsync',
      data: { title: T('Rsync Tasks'), breadcrumb: null },
      children: [{
        path: '',
        component: RsyncTaskListComponent,
        data: { title: T('Rsync Tasks'), breadcrumb: null },
      }, {
        path: ':dataset',
        component: RsyncTaskListComponent,
        data: { title: T('Rsync Tasks'), breadcrumb: null },
      }],
    },
    {
      path: 'smart',
      data: { title: T('Periodic S.M.A.R.T. Tests'), breadcrumb: null },
      children: [{
        path: '',
        component: SmartTaskListComponent,
        data: { title: T('Periodic S.M.A.R.T. Tests'), breadcrumb: null },
      }],
    },
    {
      path: 'scrub',
      data: { title: T('Scrub Tasks'), breadcrumb: null },
      children: [{
        path: '',
        component: ScrubListComponent,
        data: { title: T('Scrub Tasks'), breadcrumb: null },
      }, {
        path: 'priority',
        data: { title: T('Resilver Priority'), breadcrumb: null },
        component: ResilverConfigComponent,
      }],
    },
    {
      path: 'vmware-snapshots',
      data: { title: T('VMware Snapshots'), breadcrumb: null },
      children: [
        {
          path: '',
          component: VmwareSnapshotListComponent,
          data: { title: T('VMware Snapshots'), breadcrumb: null },
        },
      ],
    },
    {
      path: 'cloud-backup',
      data: {
        title: T('TrueCloud Backup Tasks'),
        breadcrumb: null,
      },
      component: CloudBackupListComponent,
    },
  ],
}];
