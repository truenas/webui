import { Routes } from '@angular/router';

import { TaskCalendarComponent } from './task-calendar.component';


export const TaskCalendarRoutes: Routes = [
  { path: '', component: TaskCalendarComponent, data: { title: 'Calendar' } }
];