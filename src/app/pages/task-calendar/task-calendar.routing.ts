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
import { ReplicationListComponent } from 'app/pages/task-calendar/replication/replication-list';
import { ReplicationFormComponent } from 'app/pages/task-calendar/replication/replication-form';
import { ScrubListComponent } from './scrub/scrub-list/scrub-list.component';
import { ScrubFormComponent } from './scrub/scrub-form/scrub-form.component';
import { CloudsyncListComponent } from './cloudsync/cloudsync-list/cloudsync-list.component';
import { CloudsyncFormComponent } from './cloudsync/cloudsync-form/cloudsync-form.component'; 
import { CloudsyncDeleteComponent } from './cloudsync/cloudsync-delete/cloudsync-delete.component';
import { ResilverComponent } from './resilver/resilver.component';

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
    path: 'cloudsync',
    data: {title: 'Cloud Sync', breadcrumb: 'Cloud Sync'},
    children: [{
      path: '',
      component: CloudsyncListComponent,
      data: { title: 'Cloud Sync', breadcrumb: 'Cloud Sync'} 
    }, {
      path: 'add',
      component: CloudsyncFormComponent,
      data: { title: 'Add', breadcrumb: 'Add'}
    }, {
      path: 'edit/:pk',
      component: CloudsyncFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' }
    }, {
      path: 'delete/:pk',
      component: CloudsyncDeleteComponent,
      data: { title: 'Edit', breadcrumb: 'Edit' }
    }]
  },
  {
    path: 'cron',
    data: { title: 'Cron Jobs', breadcrumb: 'Cron Jobs' },
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
    data: { title: 'Init/Shutdown Scripts', breadcrumb: 'Init/Shutdown Scripts' },
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
    data: { title: 'Periodic Snapshot Task', breadcrumb: 'Periodic Snapshot Task' },
    children: [{
      path: '',
      component: SnapshotListComponent,
      data: { title: 'Periodic Snapshot Task', breadcrumb: 'Periodic Snapshot Task' },
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
    data: { title: 'Replication', breadcrumb: 'Replication' },
    children: [{
        path: '',
        component: ReplicationListComponent,
        data: { title: 'Replication', breadcrumb: 'Replication' },
      }, {
        path: 'add-replication',
        component: ReplicationFormComponent,
        data: { title: 'Add Replication', breadcrumb: 'Add Replication' },
      },{
        path: 'edit-replication/:pk',
        component: ReplicationFormComponent,
        data: { title: 'Edit Replication', breadcrumb: 'Edit Replication' },
      }
    ]
  }, {
    path: 'rsync',
    data: { title: 'Rsync Tasks', breadcrumb: 'Rsync Tasks' },
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
    data: { title: 'S.M.A.R.T Tests', breadcrumb: 'S.M.A.R.T Tests' },
    children: [{
      path: '',
      component: SmartListComponent,
      data: { title: 'S.M.A.R.T Tests', breadcrumb: 'S.M.A.R.T Tests' },
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
    data: { title: 'Scrub Tasks', breadcrumb: 'Scrub Tasks' },
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
    data: { title: 'Resilver Priority', breadcrumb: 'Resilver Priority'},
    component: ResilverComponent,
  }]
}];
