import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  MdIconModule,
  MdDialogModule,
  MdButtonModule,
  MdCardModule
 } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CalendarModule } from 'angular-calendar';
import { TaskCalendarComponent } from './task-calendar.component';
import { TaskCalendarRoutes } from "./task-calendar.routing";

@NgModule({
  imports: [
    CommonModule,
    MdIconModule,
    MdDialogModule,
    MdButtonModule,
    MdCardModule,
    FlexLayoutModule,
    CalendarModule.forRoot(),
    RouterModule.forChild(TaskCalendarRoutes)
  ],
  declarations: [TaskCalendarComponent]
})
export class TaskCalendarModule { }
