import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent } from 'angular-calendar';
import { Subject } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  addMinutes,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours
} from 'date-fns';
import { Router } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import * as _ from 'lodash';

interface Task {
  title: string;
  description: string;
  color: any;
  start: any;
  end: any;
}

@Component({
  selector: 'task-calendar',
  templateUrl: './calendar.component.html',
  providers: [TaskService]
})
export class TaskCalendarComponent implements OnInit {
  view = 'month';
  viewDate = new Date();
  @ViewChild('modalContent', { static: true}) modalContent: TemplateRef < any > ;
  dialogRef;

  public spin: boolean = true;
  public direction: string = 'right';
  public animationMode: string = 'fling';

  public tasks: Array < any > = [{
    name: 'cron',
    label: 'Cron Job',
    icon: 'query_builder'
  }, {
    name: 'rsync',
    label: 'Rsync Task',
    icon: 'sync'
  }, {
    name: 'smart',
    label: 'S.M.A.R.T. Test',
    icon: 'add'
  }];

  protected cronjobList: any;
  protected target_dates: Array < any > = [];

  constructor(public dialogBox: MatDialog, protected router: Router, protected taskService: TaskService) {}

  ngOnInit() {
    //get cron jobs
    this.taskService.listCronjob().subscribe((res) => {
      this.cronjobList = res.data;
      for (let i in this.cronjobList) {
        this.generateEvent(this.cronjobList[i]);
      }
    });
  }

  modalData: {
    action: string,
    event: CalendarEvent
  };

  colors: any = {
    red: {
      primary: '#f44336',
      secondary: '#FAE3E3'
    },
    blue: {
      primary: '#247ba0 ',
      secondary: '#D1E8FF'
    },
    yellow: {
      primary: '#ffd97d',
      secondary: '#FDF1BA'
    }
  };

  actions: CalendarEventAction[] = [{
    label: '<i class="material-icons icon-sm">edit</i>',
    onClick: ({ event }: { event: CalendarEvent }): void => {
      this.handleEvent('Edited', event);
    }
  }, {
    label: '<i class="material-icons icon-sm">close</i>',
    onClick: ({ event }: { event: CalendarEvent }): void => {
      this.events = this.events.filter(iEvent => iEvent !== event);
      this.handleEvent('Deleted', event);
    }
  }];

  refresh: Subject < any > = new Subject();
  events: CalendarEvent[] = [];

  activeDayIsOpen: boolean = false;
  handleEvent(action: string, event: CalendarEvent): void {
    this.modalData = { event, action };
    this.dialogRef = this.dialogBox.open(this.modalContent);
  }
  dayClicked({ date, events }: { date: Date, events: CalendarEvent[] }): void {

    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.handleEvent('Dropped or resized', event);
    this.refresh.next();
  }
  closeDialog() {
    this.dialogBox.closeAll();
  }

  addTask(name) {
    this.router.navigate(new Array('/tasks/').concat(name).concat('add'));
  }

  generateEvent(job) {
    this.target_dates = [];

    let months = job.cron_month.split(',');
    let daymonths = job.cron_daymonth.split(',');
    let dayweeks = job.cron_dayweek.split(',');
    let N = 0;

    if (_.isEqual(job.cron_month, "*")) {
      months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    }
    if (_.isEqual(job.cron_dayweek, "*")) {
      dayweeks = ["1", "2", "3", "4", "5", "6", "0"];
    }
    if (_.startsWith(job.cron_daymonth, '*/')) {
      N = Number(_.trim(job.cron_daymonth, '*/'));
    }

    for (let i in months) {
      let target_date = new Date();
      target_date.setMonth(months[i] - 1);
      if (N == 0) {
        // selected day of month
        for (let j in daymonths) {
          target_date.setDate(Number(daymonths[j]));
          let dayweek = target_date.getDay();
          if (_.findIndex(dayweeks, _.unary(_.partialRight(_.includes, dayweek))) > -1) {
            let k = new Date();
            k.setMonth(months[i] - 1);
            k.setDate(Number(daymonths[j]));
            this.target_dates.push(k);
          }
        }
      } else {
        // every N day of month
        for (let j = 0; j * N < 32; j++) {
          let day = j * N;
          if (j == 0) {
            day = 1;
          }
          target_date.setDate(day);
          let dayweek = target_date.getDay();
          if (_.findIndex(dayweeks, _.unary(_.partialRight(_.includes, dayweek))) > -1) {
            let k = new Date();
            k.setMonth(months[i] - 1);
            k.setDate(day);
            this.target_dates.push(k);
          }
        }
      }
    }

    for (let i in this.target_dates) {
      this.target_dates[i].setHours(0, 0, 0, 0);
      let event: Task = {
        title: job.cron_command,
        description: job.cron_description,
        color: this.colors.blue,
        start: this.target_dates[i],
        end: addMinutes(this.target_dates[i], 30),
      };
      this.events.push(event);
      this.refresh.next();
    }
  }
}
