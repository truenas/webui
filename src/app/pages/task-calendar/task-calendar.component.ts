import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent } from 'angular-calendar';
import { Subject } from 'rxjs/Subject';
import { MdDialog, MdDialogRef } from '@angular/material';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours
} from 'date-fns';
import { Router } from '@angular/router';

@Component({
  selector: 'task-calendar',
  templateUrl: './task-calendar.component.html'
})
export class TaskCalendarComponent implements OnInit {
  view = 'month';
  viewDate = new Date();
  @ViewChild('modalContent') modalContent: TemplateRef < any > ;
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

  constructor(public dialogBox: MdDialog, protected router: Router) {}

  ngOnInit() {}
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
  events: CalendarEvent[] = [{
    start: subDays(startOfDay(new Date()), 1),
    end: addDays(new Date(), 1),
    title: 'A 3 day event',
    color: this.colors.red,
    actions: this.actions
  }, {
    start: startOfDay(new Date()),
    title: 'An event with no end date',
    color: this.colors.yellow,
    actions: this.actions
  }, {
    start: subDays(endOfMonth(new Date()), 3),
    end: addDays(endOfMonth(new Date()), 3),
    title: 'A long event that spans 2 months',
    color: this.colors.blue
  }, {
    start: addHours(startOfDay(new Date()), 2),
    end: new Date(),
    title: 'A draggable and resizable event',
    color: this.colors.yellow,
    actions: this.actions,
    resizable: {
      beforeStart: true,
      afterEnd: true
    },
    draggable: true
  }];

  activeDayIsOpen: boolean = true;
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
    this.router.navigate(new Array('/tasks/add/').concat(name));
  }
}
