import { Overlay } from '@angular/cdk/overlay';
import {
  Component, OnInit, ViewChild, ElementRef, Renderer2,
  ChangeDetectorRef, AfterViewInit, AfterViewChecked,
} from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';
import { MatMonthView } from '@angular/material/datepicker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { CronDate } from 'cron-parser';
import * as parser from 'cron-parser';
import { CronExpression } from 'cron-parser/types';
import * as dateFns from 'date-fns';
import * as dateFnsTz from 'date-fns-tz';
import globalHelptext from 'app/helptext/global-helptext';
import { FormSchedulerConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { LocaleService } from 'app/services/locale.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

interface CronPreset {
  label: string;
  value: string;
  description?: string;
}

@UntilDestroy()
@Component({
  selector: 'form-scheduler',
  templateUrl: './form-scheduler.component.html',
  styleUrls: ['./form-scheduler.component.scss', '../dynamic-field/dynamic-field.scss'],
})
export class FormSchedulerComponent implements Field, OnInit, AfterViewInit, AfterViewChecked {
  // Basic form-select props
  config: FormSchedulerConfig;
  group: FormGroup;
  fieldShow: string;
  disablePrevious: boolean;
  helptext = globalHelptext;
  timezone: string;
  offset: string;

  @ViewChild('calendar', { static: false, read: ElementRef }) calendar: ElementRef;
  @ViewChild('calendar', { static: false }) calendarComp: MatMonthView<Date>;
  @ViewChild('trigger', { static: false }) trigger: ElementRef;
  @ViewChild('preview', { static: false, read: ElementRef }) schedulePreview: ElementRef;

  private control: AbstractControl;

  isOpen = false;
  formControl = new FormControl();

  private _minutes = '0';
  private _hours = '*';
  private _days = '*';
  // Validity
  validMinutes = true;
  validHours = true;
  validDays = true;

  private _jan: boolean;
  private _feb: boolean;
  private _mar: boolean;
  private _apr: boolean;
  private _may: boolean;
  private _jun: boolean;
  private _jul: boolean;
  private _aug: boolean;
  private _sep: boolean;
  private _oct: boolean;
  private _nov: boolean;
  private _dec: boolean;

  private _sun = false;
  private _mon = false;
  private _tue = false;
  private _wed = false;
  private _thu = false;
  private _fri = false;
  private _sat = false;

  // private _monthsValues: boolean[] = [];
  private _months = '*';
  // private _daysOfWeekValues: boolean[] = [];
  private _daysOfWeek = '*';

  get minutes(): string { return this._minutes; }
  set minutes(val) {
    if (val !== '') {
      const string = '* ' + val + ' * * * *';
      try {
        parser.parseExpression(string);
        this.validMinutes = true;
        this._minutes = val;
        this.updateCronTab();
      } catch (err: unknown) {
        this.validMinutes = false;
      }
    } else {
      this.validMinutes = false;
    }
  }

  get hours(): string { return this._hours; }
  set hours(val) {
    if (val !== '' && !val.includes(' ')) {
      const string = '* * ' + val + ' * * *';
      try {
        parser.parseExpression(string);
        this.validHours = true;
        this._hours = val;
        this.updateCronTab();
      } catch (err: unknown) {
        this.validHours = false;
      }
    } else {
      this.validHours = false;
    }
  }

  get days(): string { return this._days; }
  set days(val) {
    if (val !== '') {
      const string = '* * * ' + val + ' * *';
      try {
        parser.parseExpression(string);
        this.validDays = true;
        this._days = val;
        this.updateCronTab();
      } catch (err: unknown) {
        this.validDays = false;
      }
    } else {
      this.validDays = false;
    }
  }

  get jan(): boolean { return this._jan; }
  set jan(val) { this._jan = val; this.formatMonths(); }
  get feb(): boolean { return this._feb; }
  set feb(val) { this._feb = val; this.formatMonths(); }
  get mar(): boolean { return this._mar; }
  set mar(val) { this._mar = val; this.formatMonths(); }
  get apr(): boolean { return this._apr; }
  set apr(val) { this._apr = val; this.formatMonths(); }
  get may(): boolean { return this._may; }
  set may(val) { this._may = val; this.formatMonths(); }
  get jun(): boolean { return this._jun; }
  set jun(val) { this._jun = val; this.formatMonths(); }
  get jul(): boolean { return this._jul; }
  set jul(val) { this._jul = val; this.formatMonths(); }
  get aug(): boolean { return this._aug; }
  set aug(val) { this._aug = val; this.formatMonths(); }
  get sep(): boolean { return this._sep; }
  set sep(val) { this._sep = val; this.formatMonths(); }
  get oct(): boolean { return this._oct; }
  set oct(val) { this._oct = val; this.formatMonths(); }
  get nov(): boolean { return this._nov; }
  set nov(val) { this._nov = val; this.formatMonths(); }
  get dec(): boolean { return this._dec; }
  set dec(val) { this._dec = val; this.formatMonths(); }

  get sun(): boolean { return this._sun; }
  set sun(val) { this._sun = val; this.formatDaysOfWeek(); }
  get mon(): boolean { return this._mon; }
  set mon(val) { this._mon = val; this.formatDaysOfWeek(); }
  get tue(): boolean { return this._tue; }
  set tue(val) { this._tue = val; this.formatDaysOfWeek(); }
  get wed(): boolean { return this._wed; }
  set wed(val) { this._wed = val; this.formatDaysOfWeek(); }
  get thu(): boolean { return this._thu; }
  set thu(val) { this._thu = val; this.formatDaysOfWeek(); }
  get fri(): boolean { return this._fri; }
  set fri(val) { this._fri = val; this.formatDaysOfWeek(); }
  get sat(): boolean { return this._sat; }
  set sat(val) { this._sat = val; this.formatDaysOfWeek(); }

  minDate: Date;
  maxDate: Date;
  currentDate: Date;
  activeDate: string;
  generatedSchedule: CronDate[] = [];
  generatedScheduleSubset = 0;
  protected beginTime: Date;
  protected endTime: Date;
  picker = false;
  private _textInput = '';

  _crontab = '0 0 * * *';
  get crontab(): string {
    return this._crontab;
  }

  set crontab(value: string) {
    this._crontab = value;
  }

  customOption: CronPreset = {
    label: this.translate.instant('Custom'),
    value: this.crontab,
    description: this.translate.instant('Create custom schedule'),
  };

  selectedOption: CronPreset;

  presets: CronPreset[] = [
    {
      label: this.translate.instant('Hourly'),
      value: '0 * * * *',
      description: this.translate.instant('at the start of each hour'),
    },
    {
      label: this.translate.instant('Daily'),
      value: '0 0 * * *',
      description: this.translate.instant('at 00:00 (12:00 AM)'),
    },
    {
      label: this.translate.instant('Weekly'),
      value: '0 0 * * sun',
      description: this.translate.instant('on Sundays at 00:00 (12:00 AM)'),
    },
    {
      label: this.translate.instant('Monthly'),
      value: '0 0 1 * *',
      description: this.translate.instant('on the first day of the month at 00:00 (12:00 AM)'),
    },
  ];

  get textInput(): string {
    return this._textInput;
  }

  set textInput(val: string) {
    this._textInput = val;
  }

  get colorProxy(): string {
    return this.group.value[this.config.name];
  }

  set colorProxy(val: string) {
    this.group.controls[this.config.name].setValue(val);
  }

  private _preset: CronPreset;

  get preset(): CronPreset {
    return this._preset;
  }

  set preset(p: CronPreset) {
    if (!p.value) {
      this.crontab = '0 0 * * *';
      this.convertPreset('0 0 * * *');
      this._preset = this.customOption; // { label: this.translate.instant('Custom'), value: this.crontab };
    } else {
      this.crontab = p.value;
      this.convertPreset(p.value);
      this._preset = p;
    }

    if (this.minDate && this.maxDate) {
      this.generateSchedule();
    }
  }

  constructor(
    public translate: TranslateService,
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    public overlay: Overlay,
    protected localeService: LocaleService,
    protected ws: WebSocketService,
    private store$: Store<AppState>,
  ) {
    // Set default value
    this._months = '*';

    this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
      this.timezone = timezone;
      this.minDate = this.zonedTime;
      this.maxDate = dateFns.endOfMonth(this.minDate);
      this.currentDate = this.minDate;
      this.activeDate = this.formatDateToTz(this.currentDate, this.timezone);

      this.disablePrevious = true;
    });
  }

  ngOnInit(): void {
    this.control = this.group.controls[this.config.name];

    this.control.valueChanges.pipe(untilDestroyed(this)).subscribe((evt: string) => {
      this.crontab = evt;

      const isPreset: boolean = this.presets.filter((preset) => evt == preset.value).length != 0;
      if (!isPreset) {
        this.customOption.value = evt;
        this.selectedOption = this.customOption;
      }

      this.cd.detectChanges();
    });

    if (this.control.value) {
      this.control.setValue(new EntityUtils().parseDow(this.control.value));
      this.crontab = this.control.value;
    }

    if (!this.control.value) {
      this.selectedOption = this.presets[0];
    }
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
    if (this.isOpen) { this.generateSchedule(); }
  }

  ngAfterViewChecked(): void {
    if (this.isOpen) {
      this.cd.detectChanges();
    }
  }

  onChangeOption($event: Event): void {
    if (this.config.onChangeOption !== undefined && this.config.onChangeOption != null) {
      this.config.onChangeOption({ event: $event });
    }
  }

  validPopup(): boolean {
    // Assigned to disabled attribute
    if (!this.validMinutes || !this.validHours || !this.validDays) {
      return true;
    }
    return false;
  }

  onPopupSave(): void {
    this.togglePopup();
    this.customOption.value = this._crontab;

    setTimeout(() => {
      if (this.formControl) {
        this.group.controls[this.config.name].setValue(this.crontab);
      }

      if (this.control.value) {
        this.control.setValue(new EntityUtils().parseDow(this.control.value));
      }
    });
  }

  backdropClicked(): void {
    this.togglePopup();
  }

  customClicked(): void {
    this.togglePopup();
    if (this.control.value) {
      this.control.setValue(new EntityUtils().parseDow(this.control.value));
    }
  }

  togglePopup(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => {
        this.convertPreset(this.crontab);
        this.generateSchedule();
        const popup = this.schedulePreview.nativeElement;
        popup.addEventListener('scroll', this.onScroll.bind(this));
      }, 200);
    } else {
      const popup = this.schedulePreview.nativeElement;
      popup.removeEventListener('scroll', this.onScroll);
    }
  }

  onScroll(): void {
    const el = this.schedulePreview.nativeElement;
    if ((el.scrollHeight - el.scrollTop) == el.offsetHeight) {
      this.generateSchedule(true);
    }
  }

  setCalendar(direction: 'next' | 'previous'): void {
    let newDate;
    if (direction === 'next') {
      newDate = dateFns.addMonths(this.minDate, 1);
    } else if (direction === 'previous' && !this.disablePrevious) {
      newDate = dateFns.subMonths(this.minDate, 1);
    } else {
      const message = 'Your argument is invalid';
      console.warn(message);
      return;
    }
    this.minDate = this.getMinDate(newDate);
    this.maxDate = dateFns.endOfMonth(newDate);

    this.calendarComp.activeDate = newDate;
    this.generateSchedule();
  }

  private getMinDate(d: Date): Date {
    const dt = dateFns.addSeconds(d, 1);
    const now = this.zonedTime;
    const thisMonth = dateFns.getMonth(now);
    const thisYear = dateFns.getYear(now);
    const dateMonth = dateFns.getMonth(dt);
    const dateYear = dateFns.getYear(dt);
    if (thisMonth == dateMonth && thisYear == dateYear) {
      this.disablePrevious = true;
      return this.zonedTime;
    }
    this.disablePrevious = false;
    return dateFns.startOfMonth(dt);
  }

  get zonedTime(): Date {
    return dateFnsTz.utcToZonedTime(
      dateFnsTz.zonedTimeToUtc(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone),
      this.timezone,
    );
  }

  formatDateToTz(date: Date, timezone?: string): string {
    if (!timezone) {
      if (!this.timezone) {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } else {
        timezone = this.timezone;
      }
    }
    return dateFnsTz.format(
      dateFnsTz.utcToZonedTime(
        dateFnsTz.zonedTimeToUtc(
          date,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        ),
        timezone,
      ),
      'yyyy-MM-dd\'T\'HH:mm:ssXXX',
      { timeZone: timezone },
    );
  }

  // check if candidate schedule is between the beginTime and endTime
  isValidSchedule(schedule: CronDate): boolean {
    const scheduleArray = schedule.toString().split(' ');
    const now = this.zonedTime;
    const timeStrArr = scheduleArray[4].split(':');
    const time = new Date(
      now.getFullYear(), now.getMonth(), now.getDate(),
      Number(timeStrArr[0]), Number(timeStrArr[1]), Number(timeStrArr[2]),
    );
    if (this.beginTime && this.endTime) {
      return dateFns.isWithinInterval(time, { start: this.beginTime, end: this.endTime });
    }
    return true;
  }

  private generateSchedule(nextSubset?: boolean): void {
    // get beginTime and endTime value;
    // config should define options with begin prop and end prop
    // e.g. options: ['schedule_begin', 'schedule_end']
    if (this.config.options) {
      const now = this.zonedTime;
      const beginTimeStrArr = this.group.controls[this.config.options[0]].value.split(':');
      const endTimeStrArr = this.group.controls[this.config.options[1]].value.split(':');
      this.beginTime = new Date(
        now.getFullYear(), now.getMonth(), now.getDate(),
        beginTimeStrArr[0], beginTimeStrArr[1],
      );
      this.endTime = new Date(
        now.getFullYear(), now.getMonth(), now.getDate(),
        endTimeStrArr[0], endTimeStrArr[1],
      );
    }

    const newSchedule = [];
    let adjusted: any;
    if (nextSubset) {
      adjusted = this.generatedSchedule[this.generatedSchedule.length - 1];
    } else {
      adjusted = dateFns.subSeconds(this.minDate, 1);
    }

    const options = {
      currentDate: this.formatDateToTz(adjusted, this.timezone),
      endDate: this.maxDate, // max
      iterator: true,
      tz: this.timezone,
    };

    const interval = parser.parseExpression(this.crontab, options) as CronExpression<true>;
    if (!nextSubset) {
      this.generatedScheduleSubset = 0;
    }
    const subsetEnd = this.generatedScheduleSubset + 128;
    let parseCounter = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        if (parseCounter == subsetEnd) {
          this.generatedScheduleSubset = parseCounter;
          break;
        }
        if (parseCounter >= this.generatedScheduleSubset && parseCounter < subsetEnd) {
          const obj = interval.next();
          if (this.isValidSchedule(obj.value)) {
            newSchedule.push(obj.value);
            parseCounter++;
          }
        }
      } catch (e: unknown) {
        console.warn(e);
        break;
      }
    }

    if (!nextSubset) {
      // Extra job so we can find days.
      const daySchedule: CronDate[] = [];
      const spl = this.crontab.split(' ');
      // Modified crontab so we can find days;
      const crontabDays = '0 0  ' + spl[1] + ' ' + spl[2] + ' ' + spl[3] + ' ' + spl[4];
      const intervalDays = parser.parseExpression(crontabDays, {
        currentDate: this.formatDateToTz(dateFns.subSeconds(this.minDate, 1), this.timezone),
        endDate: this.maxDate,
        iterator: true,
        tz: this.timezone,
      });

      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const obj = intervalDays.next();
          daySchedule.push(obj.value);
        } catch (e: unknown) {
          console.error(e);
          break;
        }
      }
      setTimeout(() => { this.updateCalendar(daySchedule); }, 500);
    }

    if (nextSubset) {
      // Angular doesn't like mutated data
      const clone = Object.assign([], this.generatedSchedule);
      const combinedSchedule = clone.concat(newSchedule);
      this.generatedSchedule = combinedSchedule;
    } else {
      this.generatedSchedule = newSchedule;
    }
  }

  private updateCalendar(schedule: CronDate[]): void {
    const nodes = this.getCalendarCells();
    for (let i = 0; i < nodes.length; i++) {
      const nodeClass = 'mat-calendar-body-cell ng-star-inserted';
      const aria = this.getAttribute('aria-label', nodes[i]);
      const isScheduled = this.checkSchedule(aria, schedule);
      if (isScheduled) {
        this.setAttribute('class', nodes[i], nodeClass + ' mat-calendar-body-active');
      } else if (!isScheduled && i > 0) {
        this.setAttribute('class', nodes[i], nodeClass);
      }
    }
  }

  private getCalendarCells(): HTMLElement[] {
    const rows = this.calendar.nativeElement.children[0].children[1].children;
    let cells: HTMLElement[] = [];
    for (const row of rows) {
      const tds = [];
      for (const node of row.childNodes) {
        if (node.tagName === 'TD') {
          tds.push(node);
        }
      }
      cells = cells.concat(tds);
    }
    return cells;
  }

  getAttribute(attr: string, node: HTMLElement): string {
    const a = node.attributes.getNamedItem(attr);
    if (a) {
      return a.value;
    }
  }

  setAttribute(attr: string, node: HTMLElement, value: string): void {
    const a = document.createAttribute(attr);
    a.value = value;
    node.attributes.removeNamedItem(attr);
    node.attributes.setNamedItem(a);
  }

  private checkSchedule(aria?: string, sched?: CronDate[]): boolean {
    if (!aria) { return; }
    if (!sched) { sched = this.generatedSchedule; }

    const cal = aria.split(' '); // eg. May 06, 2018
    const cd = cal[1].split(',');
    const calMonth = cal[0][0] + cal[0][1] + cal[0][2]; // limit month to 3 letters
    const calYear = cal[2];
    let calDay;
    if (cd[0].length == 1) {
      calDay = '0' + cd[0];
    } else {
      calDay = cd[0];
    }
    for (const s of sched) {
      const schedule = s.toString().split(' ');
      if (schedule[1] == calMonth && schedule[2] == calDay && schedule[3] == calYear) {
        return true;
      }
    }
  }

  formatMonths(): void {
    const months = [
      this._jan, this._feb, this._mar,
      this._apr, this._may, this._jun,
      this._jul, this._aug, this._sep,
      this._oct, this._nov, this._dec,
    ];
    const monthStrings = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    let rule = '';
    for (let i = 0; i < months.length; i++) {
      if (months[i]) {
        if (rule.length > 0 && i > 0) { rule += ','; }
        rule += monthStrings[i];
      }
    }
    if (rule.length == 0) {
      rule = '*';
    }
    this._months = rule;
    this.updateCronTab();
  }

  formatDaysOfWeek(): void {
    const dow = [this._sun, this._mon, this._tue, this._wed, this._thu, this._fri, this._sat];
    const dowStrings = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    let rule = '';
    for (let i = 0; i < dow.length; i++) {
      if (dow[i]) {
        if (rule.length > 0 && i > 0) { rule += ','; }
        rule += dowStrings[i];
      }
    }
    if (rule.length == 0) {
      rule = '*';
    }
    this._daysOfWeek = rule;
    this.updateCronTab();
  }

  updateMonthsFields(rule: string): void {
    // Wild card
    if (rule === '*') {
      this._jan = false;
      this._feb = false;
      this._mar = false;
      this._apr = false;
      this._may = false;
      this._jun = false;
      this._jul = false;
      this._aug = false;
      this._sep = false;
      this._oct = false;
      this._nov = false;
      this._dec = false;
      return;
    }

    // Assume a list and process it
    const list = rule.split(',');
    list.forEach((month) => {
      switch (month) {
        case 'jan':
          this._jan = true;
          break;
        case 'feb':
          this._feb = true;
          break;
        case 'mar':
          this._mar = true;
          break;
        case 'apr':
          this._apr = true;
          break;
        case 'may':
          this._may = true;
          break;
        case 'jun':
          this._jun = true;
          break;
        case 'jul':
          this._jul = true;
          break;
        case 'aug':
          this._aug = true;
          break;
        case 'sep':
          this._sep = true;
          break;
        case 'oct':
          this._oct = true;
          break;
        case 'nov':
          this._nov = true;
          break;
        case 'dec':
          this._dec = true;
          break;
      }
    });
  }

  updateDaysOfWeekFields(rule: string): void {
    // Wild card
    if (rule === '*') {
      this._sun = false;
      this._mon = false;
      this._tue = false;
      this._wed = false;
      this._thu = false;
      this._fri = false;
      this._sat = false;

      return;
    }

    // Assume a list and process it
    const list = rule.split(',');
    list.forEach((weekday) => {
      switch (weekday) {
        case 'sun':
          this._sun = true;
          break;
        case 'mon':
          this._mon = true;
          break;
        case 'tue':
          this._tue = true;
          break;
        case 'wed':
          this._wed = true;
          break;
        case 'thu':
          this._thu = true;
          break;
        case 'fri':
          this._fri = true;
          break;
        case 'sat':
          this._sat = true;
          break;
      }
    });
  }

  updateCronTab(preset?: string): void {
    this.crontab = '';
    if (!preset) {
      const result = this.minutes + ' ' + this.hours + ' ' + this.days + ' ' + this._months + ' ' + this._daysOfWeek;
      this.crontab = result;
    }
    if (this.minDate && this.maxDate) {
      this.generateSchedule();
    }
  }

  convertPreset(value: string): void {
    const arr = value.split(' ');
    this._minutes = arr[0];
    this._hours = arr[1];
    this._days = arr[2];

    // Months
    this.updateMonthsFields(arr[3]);
    this._months = arr[3];

    // Days of Week
    this.updateDaysOfWeekFields(arr[4]);
    this._daysOfWeek = arr[4];
  }

  // TODO: This should be a pipe (see FormatDateTimePipe)
  formatInSystemTimezone(date: CronDate): string {
    const timezonedDate = dateFnsTz.utcToZonedTime(date.toDate().valueOf(), this.timezone);
    return dateFnsTz.format(timezonedDate, 'E yyyy-MM-dd HH:mm:ss xx', { timeZone: this.timezone });
  }
}
