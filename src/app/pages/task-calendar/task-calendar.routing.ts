import { Routes } from '@angular/router';

import { TaskCalendarComponent } from './calendar/calendar.component';
import { CronFormComponent } from './cron/cron-form/cron-form.component';
import { CronListComponent } from './cron/cron-list/cron-list.component';
import { InitshutdownListComponent } from './initshutdown/initshutdown-list/initshutdown-list.component';
import { InitshutdownFormComponent } from './initshutdown/initshutdown-form/initshutdown-form.component';
import { SnapshotListComponent } from './snapshot/snapshot-list/snapshot-list.component';
import { SnapshotFormComponent } from './snapshot/snapshot-form/snapshot-form.component';
import { RsyncListComponent } from './rsync/rsync-list/rsync-list.component';
import { RsyncFormComponent } from './rsync/rsync-form/rsync-form.component';
import { SmartListComponent } from './smart/smart-list/smart-list.component';
import { SmartFormComponent } from './smart/smart-form/smart-form.component';
import { ReplicationListComponent } from './replication/replication-list/replication-list.component';
import { ReplicationFormComponent } from './replication/replication-form/replication-form.component';
import { ScrubListComponent } from './scrub/scrub-list/scrub-list.component';
import { ScrubFormComponent } from './scrub/scrub-form/scrub-form.component';
import { CloudsyncListComponent } from './cloudsync/cloudsync-list/cloudsync-list.component';
import { CloudsyncFormComponent } from './cloudsync/cloudsync-form/cloudsync-form.component';
import { ResilverComponent } from './resilver/resilver.component';
import { EntityDashboardComponent } from '../common/entity/entity-dashboard/entity-dashboard.component';

export const TaskCalendarRoutes: Routes = [{
  path: '',
  data: { title: 'Calendar' },
  children: [
  // {
  //   path: 'calendar',
  //   component: TaskCalendarComponent,
  //   data: { title: 'Calendar', breadcrumb: 'Calendar' }
  // }, 
  {
    path: '',
    component: EntityDashboardComponent,
  },
  {
    path: 'cloudsync',
    data: {title: 'Cloud Sync Tasks', breadcrumb: 'Cloud Sync Tasks', icon: 'event_note'},
    children: [{
      path: '',
      component: CloudsyncListComponent,
      data: { title: 'Cloud Sync Tasks', breadcrumb: 'Cloud Sync Tasks'} 
    }, {
      path: 'add',
      component: CloudsyncFormComponent,
      data: { title: 'Add', breadcrumb: 'Add'}
    }, {
      path: 'edit/:pk',
      component: CloudsyncFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' }
    }]
  },
  {
    path: 'cron',
    data: { title: 'Cron Jobs', breadcrumb: 'Cron Jobs', icon: 'event_note' },
    children: [{
      path: '',
      component: CronListComponent,
      data: { title: 'Cron Jobs', breadcrumb: 'Cron Jobs' },
    }, {
      path: 'add',
      component: CronFormComponent,
      data: { title: 'Add', breadcrumb: 'Add' }
    }, {
      path: 'edit/:pk',
      component: CronFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' }
    }]
  }, {
    path: 'initshutdown',
    data: { title: 'Init/Shutdown Scripts', breadcrumb: 'Init/Shutdown Scripts', icon: 'event_note' },
    children: [{
      path: '',
      component: InitshutdownListComponent,
      data: { title: 'Init/Shutdown Scripts', breadcrumb: 'Init/Shutdown Scripts' },
    }, {
      path: 'add',
      component: InitshutdownFormComponent,
      data: { title: 'Add', breadcrumb: 'Add' }
    }, {
      path: 'edit/:pk',
      component: InitshutdownFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' }
    }]
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
      data: { title: 'Add', breadcrumb: 'Add' }
    }, {
      path: 'edit/:pk',
      component: SnapshotFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' }
    }]
  }, {
    path: 'replication',
    data: { title: 'Replication Tasks', breadcrumb: 'Replication Tasks', icon: 'event_note' },
    children: [{
        path: '',
        component: ReplicationListComponent,
        data: { title: 'Replication Tasks', breadcrumb: 'Replication Tasks' },
      }, 
      {
        path: 'add',
        component: ReplicationFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },{
        path: 'edit/:pk',
        component: ReplicationFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }
    ]
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
      data: { title: 'Add', breadcrumb: 'Add' }
    }, {
      path: 'edit/:pk',
      component: RsyncFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' }
    }]
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
      data: { title: 'Add', breadcrumb: 'Add' }
    }, {
      path: 'edit/:pk',
      component: SmartFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' }
    }]
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
      data: { title: 'Add', breadcrumb: 'Add' }
    }, {
      path: 'edit/:pk',
      component: ScrubFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' }
    }]
  }, {
    path: 'resilver',
    data: { title: 'Resilver Priority', breadcrumb: 'Resilver Priority', icon: 'event_note'},
    component: ResilverComponent,
  }]
}];
