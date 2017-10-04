import { Routes } from '@angular/router';

import { TaskCalendarComponent } from './calendar/calendar.component';
import { CronFormComponent } from './cron/cron-form/cron-form.component';
import { CronListComponent } from './cron/cron-list/cron-list.component';
import { InitshutdownListComponent } from './initshutdown/initshutdown-list/initshutdown-list.component';
import { InitshutdownFormComponent } from './initshutdown/initshutdown-form/initshutdown-form.component';
import { SnapshotListComponent } from './snapshot/snapshot-list/snapshot-list.component';
import { SnapshotFormComponent } from './snapshot/snapshot-form/snapshot-form.component';

export const TaskCalendarRoutes: Routes = [{
  path: '',
  data: { title: 'Calendar' },
  children: [{
    path: 'calendar',
    component: TaskCalendarComponent,
    data: { title: 'Calendar', breadcrumb: 'Calendar' }
  }, {
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
  }]
}];
