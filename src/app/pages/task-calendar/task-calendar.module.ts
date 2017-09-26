import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  MdIconModule,
  MdDialogModule,
  MdButtonModule,
  MdCardModule,
  MaterialModule
 } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CalendarModule } from 'angular-calendar';
import { TaskCalendarComponent } from './calendar/calendar.component';
import { TaskCalendarRoutes } from "./task-calendar.routing";
import { EntityModule } from '../common/entity/entity.module';

import { CronFormComponent } from './cron/cron-form/cron-form.component';
import { CronListComponent } from './cron/cron-list/cron-list.component';

@NgModule({
  imports: [
    CommonModule,
    MdIconModule,
    MdDialogModule,
    MdButtonModule,
    MdCardModule,
    MaterialModule,
    FlexLayoutModule,
    CalendarModule.forRoot(),
    RouterModule.forChild(TaskCalendarRoutes),
    EntityModule,
  ],
  declarations: [
    TaskCalendarComponent,
    CronFormComponent,
    CronListComponent
  ]
})
export class TaskCalendarModule { }
