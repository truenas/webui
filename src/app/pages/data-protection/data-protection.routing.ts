import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { DataProtectionDashboardComponent } from 'app/pages/data-protection/data-protection-dashboard.component';
import { RsyncTaskListComponent } from 'app/pages/data-protection/rsync-task/rsync-task-list/rsync-task-list.component';
import { SmartTaskListComponent } from 'app/pages/data-protection/smart-task/smart-task-list/smart-task-list.component';
import { SnapshotTaskListComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-list/snapshot-task-list.component';
import { VmwareSnapshotListComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.component';
import { CloudsyncListComponent } from './cloudsync/cloudsync-list/cloudsync-list.component';
import { ReplicationListComponent } from './replication/replication-list/replication-list.component';
import { ReplicationWizardComponent } from './replication/replication-wizard/replication-wizard.component';
import { ResilverConfigComponent } from './scrub-task/resilver-config/resilver-config.component';
import { ScrubListComponent } from './scrub-task/scrub-list/scrub-list.component';

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
      data: { title: T('Cloud Sync Tasks'), breadcrumb: T('Cloud Sync Tasks'), icon: 'event_note' },
      children: [{
        path: '',
        component: CloudsyncListComponent,
        data: { title: T('Cloud Sync Tasks'), breadcrumb: T('Cloud Sync Tasks') },
      }, {
        path: ':dataset',
        component: CloudsyncListComponent,
        data: { title: T('Cloud Sync Tasks'), breadcrumb: T('Cloud Sync Tasks') },
      }],
    }, {
      path: 'snapshot',
      data: { title: T('Periodic Snapshot Tasks'), breadcrumb: T('Periodic Snapshot Tasks'), icon: 'event_note' },
      children: [{
        path: '',
        component: SnapshotTaskListComponent,
        data: { title: T('Periodic Snapshot Tasks'), breadcrumb: T('Periodic Snapshot Tasks') },
      }],
    }, {
      path: 'snapshot/:dataset',
      data: { title: T('Periodic Snapshot Tasks'), breadcrumb: T('Periodic Snapshot Tasks'), icon: 'event_note' },
      children: [{
        path: '',
        component: SnapshotTaskListComponent,
        data: { title: T('Periodic Snapshot Tasks'), breadcrumb: T('Periodic Snapshot Tasks') },
      }],
    }, {
      path: 'replication',
      data: { title: T('Replication Tasks'), breadcrumb: T('Replication Tasks'), icon: 'event_note' },
      children: [{
        path: '',
        component: ReplicationListComponent,
        data: { title: T('Replication Tasks'), breadcrumb: T('Replication Tasks') },
      }, {
        path: ':dataset',
        component: ReplicationListComponent,
        data: { title: T('Replication Tasks'), breadcrumb: T('Replication Tasks') },
      }, {
        path: 'wizard',
        component: ReplicationWizardComponent,
        data: { title: T('Wizard'), breadcrumb: T('Wizard') },
      },
      ],
    }, {
      path: 'rsync',
      data: { title: T('Rsync Tasks'), breadcrumb: T('Rsync Tasks'), icon: 'event_note' },
      children: [{
        path: '',
        component: RsyncTaskListComponent,
        data: { title: T('Rsync Tasks'), breadcrumb: T('Rsync Tasks') },
      }, {
        path: ':dataset',
        component: RsyncTaskListComponent,
        data: { title: T('Rsync Tasks'), breadcrumb: T('Rsync Tasks') },
      }],
    }, {
      path: 'smart',
      data: { title: T('S.M.A.R.T. Tests'), breadcrumb: T('S.M.A.R.T. Tests'), icon: 'event_note' },
      children: [{
        path: '',
        component: SmartTaskListComponent,
        data: { title: T('S.M.A.R.T. Tests'), breadcrumb: T('S.M.A.R.T. Tests') },
      }],
    }, {
      path: 'scrub',
      data: { title: T('Scrub Tasks'), breadcrumb: T('Scrub Tasks'), icon: 'event_note' },
      children: [{
        path: '',
        component: ScrubListComponent,
        data: { title: T('Scrub Tasks'), breadcrumb: T('Scrub Tasks') },
      }, {
        path: 'priority',
        data: { title: T('Resilver Priority'), breadcrumb: T('Resilver Priority'), icon: 'event_note' },
        component: ResilverConfigComponent,
      }],
    }, {
      path: 'vmware-snapshots',
      data: { title: T('VMware Snapshots'), breadcrumb: T('VMware Snapshots'), icon: 'camera_alt' },
      children: [
        {
          path: '',
          component: VmwareSnapshotListComponent,
          data: { title: T('VMware Snapshots'), breadcrumb: T('VMware Snapshots') },
        },
      ],
    },
  ],
}];
