import { Routes } from '@angular/router';
import { RsyncTaskListComponent } from 'app/pages/data-protection/rsync-task/rsync-task-list/rsync-task-list.component';
import { SmartTaskListComponent } from 'app/pages/data-protection/smart-task/smart-task-list/smart-task-list.component';
import { CloudsyncListComponent } from './cloudsync/cloudsync-list/cloudsync-list.component';
import { DataProtectionDashboardComponent } from './components/data-protection-dashboard/data-protection-dashboard.component';
import { ReplicationFormComponent } from './replication/replication-form/replication-form.component';
import { ReplicationListComponent } from './replication/replication-list/replication-list.component';
import { ReplicationWizardComponent } from './replication/replication-wizard/replication-wizard.component';
import { ResilverConfigComponent } from './scrub-task/resilver-config/resilver-config.component';
import { ScrubListComponent } from './scrub-task/scrub-list/scrub-list.component';
import { SnapshotListComponent } from './snapshot/snapshot-list/snapshot-list.component';

export const dataProtectionRoutes: Routes = [{
  path: '',
  data: { title: 'Data Protection' },
  children: [
    {
      path: '',
      component: DataProtectionDashboardComponent,
    },
    {
      path: 'cloudsync',
      data: { title: 'Cloud Sync Tasks', breadcrumb: 'Cloud Sync Tasks', icon: 'event_note' },
      children: [{
        path: '',
        component: CloudsyncListComponent,
        data: { title: 'Cloud Sync Tasks', breadcrumb: 'Cloud Sync Tasks' },
      }, {
        path: ':dataset',
        component: CloudsyncListComponent,
        data: { title: 'Cloud Sync Tasks', breadcrumb: 'Cloud Sync Tasks' },
      }],
    }, {
      path: 'snapshot',
      data: { title: 'Periodic Snapshot Tasks', breadcrumb: 'Periodic Snapshot Tasks', icon: 'event_note' },
      children: [{
        path: '',
        component: SnapshotListComponent,
        data: { title: 'Periodic Snapshot Tasks', breadcrumb: 'Periodic Snapshot Tasks' },
      }],
    }, {
      path: 'snapshot/:dataset',
      data: { title: 'Periodic Snapshot Tasks', breadcrumb: 'Periodic Snapshot Tasks', icon: 'event_note' },
      children: [{
        path: '',
        component: SnapshotListComponent,
        data: { title: 'Periodic Snapshot Tasks', breadcrumb: 'Periodic Snapshot Tasks' },
      }],
    }, {
      path: 'replication',
      data: { title: 'Replication Tasks', breadcrumb: 'Replication Tasks', icon: 'event_note' },
      children: [{
        path: '',
        component: ReplicationListComponent,
        data: { title: 'Replication Tasks', breadcrumb: 'Replication Tasks' },
      }, {
        path: ':dataset',
        component: ReplicationListComponent,
        data: { title: 'Replication Tasks', breadcrumb: 'Replication Tasks' },
      }, {
        path: 'add',
        component: ReplicationFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      }, {
        path: 'edit/:pk',
        component: ReplicationFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }, {
        path: 'wizard',
        component: ReplicationWizardComponent,
        data: { title: 'Wizard', breadcrumb: 'Wizard' },
      },
      ],
    }, {
      path: 'rsync',
      data: { title: 'Rsync Tasks', breadcrumb: 'Rsync Tasks', icon: 'event_note' },
      children: [{
        path: '',
        component: RsyncTaskListComponent,
        data: { title: 'Rsync Tasks', breadcrumb: 'Rsync Tasks' },
      }, {
        path: ':dataset',
        component: RsyncTaskListComponent,
        data: { title: 'Rsync Tasks', breadcrumb: 'Rsync Tasks' },
      }],
    }, {
      path: 'smart',
      data: { title: 'S.M.A.R.T. Tests', breadcrumb: 'S.M.A.R.T. Tests', icon: 'event_note' },
      children: [{
        path: '',
        component: SmartTaskListComponent,
        data: { title: 'S.M.A.R.T. Tests', breadcrumb: 'S.M.A.R.T. Tests' },
      }],
    }, {
      path: 'scrub',
      data: { title: 'Scrub Tasks', breadcrumb: 'Scrub Tasks', icon: 'event_note' },
      children: [{
        path: '',
        component: ScrubListComponent,
        data: { title: 'Scrub Tasks', breadcrumb: 'Scrub Tasks' },
      }, {
        path: 'priority',
        data: { title: 'Resilver Priority', breadcrumb: 'Resilver Priority', icon: 'event_note' },
        component: ResilverConfigComponent,
      }],
    },
  ],
}];
