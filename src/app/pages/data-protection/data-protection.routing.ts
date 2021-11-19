import { Routes } from '@angular/router';
import { CloudsyncFormComponent } from './cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudsyncListComponent } from './cloudsync/cloudsync-list/cloudsync-list.component';
import { DataProtectionDashboardComponent } from './components/data-protection-dashboard/data-protection-dashboard.component';
import { ReplicationFormComponent } from './replication/replication-form/replication-form.component';
import { ReplicationListComponent } from './replication/replication-list/replication-list.component';
import { ReplicationWizardComponent } from './replication/replication-wizard/replication-wizard.component';
import { RsyncFormComponent } from './rsync/rsync-form/rsync-form.component';
import { RsyncListComponent } from './rsync/rsync-list/rsync-list.component';
import { ResilverConfigComponent } from './scrub/resilver-config/resilver-config.component';
import { ScrubFormComponent } from './scrub/scrub-form/scrub-form.component';
import { ScrubListComponent } from './scrub/scrub-list/scrub-list.component';
import { SmartFormComponent } from './smart/smart-form/smart-form.component';
import { SmartListComponent } from './smart/smart-list/smart-list.component';
import { SnapshotFormComponent } from './snapshot/snapshot-form/snapshot-form.component';
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
        path: 'add',
        component: CloudsyncFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      }, {
        path: 'edit/:pk',
        component: CloudsyncFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }],
    }, {
      path: 'snapshot',
      data: { title: 'Periodic Snapshot Tasks', breadcrumb: 'Periodic Snapshot Tasks', icon: 'event_note' },
      children: [{
        path: '',
        component: SnapshotListComponent,
        data: { title: 'Periodic Snapshot Tasks', breadcrumb: 'Periodic Snapshot Tasks' },
      }, {
        path: 'add',
        component: SnapshotFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      }, {
        path: 'edit/:pk',
        component: SnapshotFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }],
    }, {
      path: 'replication',
      data: { title: 'Replication Tasks', breadcrumb: 'Replication Tasks', icon: 'event_note' },
      children: [{
        path: '',
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
        component: RsyncListComponent,
        data: { title: 'Rsync Tasks', breadcrumb: 'Rsync Tasks' },
      }, {
        path: 'add',
        component: RsyncFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      }, {
        path: 'edit/:pk',
        component: RsyncFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }],
    }, {
      path: 'smart',
      data: { title: 'S.M.A.R.T. Tests', breadcrumb: 'S.M.A.R.T. Tests', icon: 'event_note' },
      children: [{
        path: '',
        component: SmartListComponent,
        data: { title: 'S.M.A.R.T. Tests', breadcrumb: 'S.M.A.R.T. Tests' },
      }, {
        path: 'add',
        component: SmartFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      }, {
        path: 'edit/:pk',
        component: SmartFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }],
    }, {
      path: 'scrub',
      data: { title: 'Scrub Tasks', breadcrumb: 'Scrub Tasks', icon: 'event_note' },
      children: [{
        path: '',
        component: ScrubListComponent,
        data: { title: 'Scrub Tasks', breadcrumb: 'Scrub Tasks' },
      }, {
        path: 'add',
        component: ScrubFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      }, {
        path: 'edit/:pk',
        component: ScrubFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }, {
        path: 'priority',
        data: { title: 'Resilver Priority', breadcrumb: 'Resilver Priority', icon: 'event_note' },
        component: ResilverConfigComponent,
      }],
    },
  ],
}];
