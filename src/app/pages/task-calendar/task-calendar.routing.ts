import { Routes } from '@angular/router';

import { TaskCalendarComponent } from './task-calendar.component';
import { CronFormComponent } from './cron/cron-form/cron-form.component';


export const TaskCalendarRoutes: Routes = [{
  path: '',
  data: { title: 'Calendar' },
  children: [{
    path: '',
    component: TaskCalendarComponent,
    data: { title: 'Calendar', breadcrumb: 'Calendar' }
  }, {
    path: 'add',
    data: { title: 'Add', breadcrumb: 'Add' },
    children: [{
      path: 'cron',
      component: CronFormComponent,
      data: { title: 'Cron Job', breadcrumb: 'Cron Job' },
    }]
  }, {
    path: 'edit/:pk',
    component: CronFormComponent,
    data: { title: 'Edit', breadcrumb: 'Edit' },
  }]
}];
