import {Component,AfterViewInit,OnInit,OnChanges, ViewChild, ElementRef, QueryList, Renderer2} from '@angular/core';
import {FormGroup, FormControl} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

import {MatDatepickerModule, MatMonthView} from '@angular/material';
import * as parser from 'cron-parser';

interface CronPreset {
  label:string;
  value:string;
}

interface CronDate {
  value:any;
  done:boolean;
}

@Component({
  selector : 'form-scheduler',
  templateUrl : './form-scheduler.component.html',
  styleUrls:['./form-scheduler.component.css']
})
export class FormSchedulerComponent implements Field, OnInit, AfterViewInit, OnChanges{

  // Basic form-select props
  public config:FieldConfig;
  public group: FormGroup;
  public fieldShow: string;

  @ViewChild('calendar', {read:ElementRef}) calendar: ElementRef;
  @ViewChild('calendar') calendarComp;
  @ViewChild('trigger') trigger: ElementRef;
  public isOpen:boolean = false;
  formControl = new FormControl();
  private _currentValue:string;
  get currentValue(){
    return this.group.controls[this.config.name].value;
  }

  private _minutes:string = "0";
  private _hours:string = "*";
  private _days:string = "*";

  private _jan:boolean;
  private _feb:boolean;
  private _mar:boolean;
  private _apr:boolean;
  private _may:boolean;
  private _jun:boolean;
  private _jul:boolean;
  private _aug:boolean;
  private _sep:boolean;
  private _oct:boolean;
  private _nov:boolean;
  private _dec:boolean;

  private _sun:boolean = false;
  private _mon:boolean = false;
  private _tue:boolean = false;
  private _wed:boolean = false;
  private _thu:boolean = false;
  private _fri:boolean = false;
  private _sat:boolean = false;

  //private _monthsValues: boolean[] = [];
  private _months:string = "*";
  //private _daysOfWeekValues: boolean[] = [];
  private _daysOfWeek:string = "*";

  get minutes(){ return this._minutes}
  set minutes(val){ this._minutes = val; this.updateCronTab()}

  get hours(){ return this._hours}
  set hours(val){ this._hours = val; this.updateCronTab()}

  get days(){ return this._days}
  set days(val){ this._days = val; this.updateCronTab()}

  get jan(){ return this._jan}
  set jan(val){this._jan = val; this.formatMonths();}
  get feb(){ return this._feb}
  set feb(val){this._feb = val; this.formatMonths();}
  get mar(){ return this._mar}
  set mar(val){this._mar = val; this.formatMonths();}
  get apr(){ return this._apr}
  set apr(val){this._apr = val; this.formatMonths();}
  get may(){ return this._may}
  set may(val){this._may = val; this.formatMonths();}
  get jun(){ return this._jun}
  set jun(val){this._jun = val; this.formatMonths();}
  get jul(){ return this._jul}
  set jul(val){this._jul = val; this.formatMonths();}
  get aug(){ return this._aug}
  set aug(val){this._aug = val; this.formatMonths();}
  get sep(){ return this._sep}
  set sep(val){this._sep = val; this.formatMonths();}
  get oct(){ return this._oct}
  set oct(val){this._oct = val; this.formatMonths();}
  get nov(){ return this._nov}
  set nov(val){this._nov = val; this.formatMonths();}
  get dec(){ return this._dec}
  set dec(val){this._dec = val; this.formatMonths();}

  get sun(){ return this._sun}
  set sun(val){ this._sun = val; this.formatDaysOfWeek()}
  get mon(){ return this._mon}
  set mon(val){ this._mon = val; this.formatDaysOfWeek()}
  get tue(){ return this._tue}
  set tue(val){ this._tue = val; this.formatDaysOfWeek()}
  get wed(){ return this._wed}
  set wed(val){ this._wed = val; this.formatDaysOfWeek()}
  get thu(){ return this._thu}
  set thu(val){ this._thu = val; this.formatDaysOfWeek()}
  get fri(){ return this._fri}
  set fri(val){ this._fri = val; this.formatDaysOfWeek()}
  get sat(){ return this._sat}
  set sat(val){ this._sat = val; this.formatDaysOfWeek()}

  public minDate;
  public maxDate;
  public activeDate;
  public generatedSchedule: any[] = [];
  public picker:boolean = false;
  private _textInput:string = '';
  public crontab:string = "custom";
  private _preset:CronPreset;// = { label:"Custom", value:"* * * * *"}; 
  public presets: CronPreset[] = [
    {
      label: "Hourly",
      value: "0 * * * *"
    },
    {
      label: "Daily",
      value: "0 0 * * *"
    },
    {
      label: "Weekly",
      value: "0 0 * * sun"
    },
    {
      label: "Monthly",
      value: "0 0 1 * *"
    }
  ];

  get textInput(){
    return this._textInput;
  }

  set textInput(val:string){
    this._textInput = val;
    console.log("TEXT INPUT CHANGED!!");
    console.log(val)
  }

  get colorProxy(){
    return this.group.value[this.config.name];
  }

  set colorProxy(val:string){
    this.group.controls[this.config.name].setValue(val);;
  }

  get preset(){
    return this._preset;
  }

  set preset(p){
    if(p.value == "custom"){
      this.crontab = "0 0 * * *";
      this.convertPreset("0 0 * * *");
      this._preset = {label:"Custom", value:this.crontab};
    } else {
      this.crontab = p.value;
      this.convertPreset(p.value);
      this._preset = p;
    }
    
    if(this.minDate && this.maxDate){
      this.generateSchedule(this.minDate, this.maxDate);
    }
  }

  constructor(public translate: TranslateService, private renderer: Renderer2){
    //Set default value
    this.preset = this.presets[1];
    this._months = "*";

    let min = new Date('Tue 1 May 2018 00:00:00 UTC');
    let max = new Date('Thur 31 May 2018 23:59:59 UTC');
    this.minDate = min;
    this.maxDate = max;
    this.activeDate = max; //Determines what month is displayed
  }

  ngOnChanges(changes){
    if(changes.group){
      //console.log(this.group);
    }
  }

  ngOnInit(){
    this.config.value = this.group.value[this.config.name];
  }

  ngAfterViewInit(){
    if(this.isOpen){ this.generateSchedule(this.minDate, this.maxDate);}
  }

  onChangeOption($event) {
    if (this.config.onChangeOption !== undefined && this.config.onChangeOption != null) {
      this.config.onChangeOption({ event: $event });
    }
  }

  onPopupSave(){
    this.togglePopup();
    if(this.formControl){
      this.group.controls[this.config.name].setValue(this.crontab);
      console.log(this.group.controls[this.config.name].value)
    }
  }
  togglePopup(){
    this.isOpen = !this.isOpen;
    if(this.crontab == "custom"){
      this.crontab = "0 * * * *";
      if(this.isOpen){
        setTimeout(() => {this.generateSchedule(this.minDate, this.maxDate);},500);
      }
    } else{
      if(this.isOpen){
        setTimeout(() => {this.updateCalendar();},500);
      }
    }
    console.log(this.group.controls[this.config.name]);
  }

  private generateSchedule(min, max){
    let newSchedule = [];
    let options = {
      currentDate: min,
      endDate: max,
      iterator: true
    };
    let interval = parser.parseExpression("0 " + this.crontab, options);

    while (true) {
      try {
        let obj:any = interval.next();
        newSchedule.push(obj.value);
      } catch (e) {
        break;
      }
    }
    this.generatedSchedule = newSchedule;
    this.updateCalendar();
  }

  private updateCalendar(){
    let nodes = this.getCalendarCells();
    for(let i = 0; i < nodes.length; i++){
      let nodeClass = "mat-calendar-body-cell ng-star-inserted";
      let aria = this.getAttribute("aria-label",nodes[i]);
      let isScheduled = this.checkSchedule(aria);
      if(isScheduled){
        this.setAttribute("class", nodes[i], nodeClass + " mat-calendar-body-active");
      } else if(!isScheduled && i > 0) {
        this.setAttribute("class", nodes[i], nodeClass);
      }
    }
  }

  private getCalendarCells(){
    let rows = this.calendar.nativeElement.children[0].children[1].children;
    let cells = [];
    
    for(let i = 0; i < rows.length; i++){
      let row = rows[i].childNodes;
      let tds = [];
      for(let index = 0; index < row.length; index++){
        if(row[index].tagName == "TD"){
          tds.push(row[index])
        }
      }
      cells = cells.concat(tds);
    }
    return cells;
  }

  getAttribute(attr, node){
    let a = node.attributes.getNamedItem(attr);
    if(a){
      return a.value;
    }
  }

  setAttribute(attr, node, value){
    let a = (<any>document).createAttribute(attr);
    a.value = value;
    node.attributes.removeNamedItem(attr);
    node.attributes.setNamedItem(a);
  }

  private checkSchedule(aria?){
    if(!aria){ return; }

    let cal = aria.split(" "); // eg. May 06, 2018
    let cd = cal[1].split(",");
    let calMonth = cal[0];
    let calYear = cal[2];
    let calDay;
    if(cd[0].length == 1){ 
      calDay = "0" + cd[0];
    } else {
      calDay = cd[0];
    }

    for(let i in this.generatedSchedule){
      let s = this.generatedSchedule[i]; // eg. Sun May 06 2018 04:05:00 GMT-0400 (EDT)
      let schedule = s.toString().split(" ");
      if(schedule[1] == calMonth && schedule[2] == calDay && schedule[3] == calYear ){
        return true
      }
    }
  }

  formatMonths(){ 
    let months = [this._jan, this._feb, this._mar, this._apr, this._may, this._jun, this._jul, this._aug, this._sep, this._oct, this._nov, this._dec];
    let months_str = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    let rule = "";
    for(let i = 0; i < months.length; i++){
      if(months[i]){
        if(rule.length > 0 && i > 0){ rule += ","}
        rule +=  months_str[i];
      }
    }
    if(rule.length == 0){
      rule = "*";
    }
    this._months = rule;
    this.updateCronTab();
  }

  formatDaysOfWeek(){
    let dow = [this._sun, this._mon, this._tue, this._wed, this._thu, this._fri, this._sat];
    let dow_str = ["sun","mon","tue","wed","thu","fri","sat"];
    let rule = "";
    for(let i = 0; i < dow.length; i++){
      if(dow[i]){
        if(rule.length > 0 && i > 0){ rule += ","}
        rule +=  dow_str[i];
      }
    }
    if(rule.length == 0){
      rule = "*";
    }
    this._daysOfWeek = rule;
    this.updateCronTab();
  }

  updateMonthsFields(rule){
    // Wild card
   if(rule == "*"){
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
   let list = rule.split(",");
   for(let i in list){
      switch(list[i]){
        case "jan":
          this._jan = true;
        break;
        case "feb":
          this._feb = true;
        break;
        case "mar":
          this._mar = true
        break;
        case "apr":
          this._apr = true;
        break;
        case "may":
          this._may = true;
        break;
        case "jun":
          this._jun = true;
        break;
        case "jul":
          this._jul = true;
        break;
        case "aug":
          this._aug = true
        break;
        case "sep":
          this._sep = true;
        break;
        case "oct":
          this._oct = true;
        break;
        case "nov":
          this._nov = true;
        break;
        case "dec":
          this._dec = true;
        break;
      }
    }
   }  

  updateDaysOfWeekFields(rule){
    // Wild card
   if(rule == "*"){
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
   let list = rule.split(",");
   for(let i in list){
      switch(list[i]){
        case "sun":
          this._sun = true;
        break;
        case "mon":
          this._mon = true;
        break;
        case "tue":
          this._tue = true
        break;
        case "wed":
          this._wed = true;
        break;
        case "thu":
          this._thu = true;
        break;
        case "fri":
          this._fri = true;
        break;
        case "sat":
          this._sat = true;
        break;
      }
    }
   }  

  updateCronTab(preset?){
    this.crontab = "";
    if(!preset){
      let result = this.minutes + " " + this.hours + " " + this.days + " " + this._months + " " + this._daysOfWeek;
      this.crontab = result;
    }
    if(this.minDate && this.maxDate){
      this.generateSchedule(this.minDate, this.maxDate);
    }
  }

  convertPreset(value){
    let arr = value.split(" ");
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
}
