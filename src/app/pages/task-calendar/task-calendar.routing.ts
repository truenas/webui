import { Routes } from '@angular/router';

import { TaskCalendarComponent } from './calendar/calendar.component';
import { CronFormComponent } from './cron/cron-form/cron-form.component';
import { CronListComponent } from './cron/cron-list/cron-list.component';
import { InitshutdownListComponent } from './initshutdown/initshutdown-list/initshutdown-list.component';

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
    }]
  }]
}];
