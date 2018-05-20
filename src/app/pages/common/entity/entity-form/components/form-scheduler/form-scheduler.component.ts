import {Component,AfterViewInit,OnInit,OnChanges, ViewChild, ElementRef, QueryList} from '@angular/core';
import {FormGroup} from '@angular/forms';

import {MatDatepickerModule, MatMonthView} from '@angular/material';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';
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
export class FormSchedulerComponent implements Field,OnInit, AfterViewInit,OnChanges{

  @ViewChild('calendar') calendar: ElementRef;

  public minDate;
  public maxDate;
  public activeDate;
  public generatedSchedule: any[] = [];
  public config:FieldConfig;
  group: FormGroup;
  fieldShow: string;
  public picker:boolean = false;
  private _textInput:string = '';
  public crontab:string = "* * * * * *";
  public preset:CronPreset = { label:"Custom", value:"* * * * * *"};
  private presets: CronPreset[] = [
    {
      label: "Hourly",
      value: "0 0 * * * *"
    },
    {
      label: "Daily",
      value: "0 0 0 * * *"
    },
    {
      label: "Weekly",
      value: "0 0 0 * * 1"
    },
    {
      label: "Monthly",
      value: "0 0 0 1 * *"
    },
    {
      label:"Custom",
      value: "custom"
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

  constructor(){
    //Set default value
    //this.preset = this.presets[1];

    let min = new Date('Tue 1 May 2018 00:00:00 UTC');
    //let min = Date.now();
    let max = new Date('Thur 31 May 2018 23:59:59 UTC');
    this.minDate = min;
    this.maxDate = max;
    this.activeDate = max; //Determines what month is displayed
  }

  ngOnChanges(changes){
    if(changes.group){
    }
  }

  ngOnInit(){
    this.config.value = this.group.value[this.config.name];
  }

  ngAfterViewInit(){
    this.generateSchedule(this.minDate, this.maxDate);
  }

  cpListener(evt:string, data: any): void {
    this.group.value[this.config.name] = data;
  }

  inputListener(evt:string, data:any): void {
    console.log(evt);
    this.group.value[this.config.name] = data;
  }

  public onChangeColor(color: string): any {
    //console.log(color);
    }

  public togglePicker(){
    this.picker = !this.picker;
  }

  private generateSchedule(min, max){
    let options = {
      currentDate: min,
      endDate: max,
      iterator: true
    };
    this.crontab = "0 5 4 */5 * *";
    let interval = parser.parseExpression(this.crontab, options);

    while (true) {
      try {
        let obj:any = interval.next();
        console.log(obj);
        this.generatedSchedule.push(obj.value);
        console.log('value:', obj.value.toString(), 'done:', obj.done);
      } catch (e) {
        break;
      }
    }
    this.updateCalendar();
  }

  private updateCalendar(){
    console.log("UPDATE CALENDAR");
    console.log(this.generatedSchedule);
    let nodes = (<any>document).querySelectorAll('form-scheduler mat-month-view td.mat-calendar-body-cell')
    //console.log(nodes);
    //console.warn(this.calendar);
    for(let i in nodes){
      //console.log(nodes);
      nodes[i].className = "mat-calendar-body-cell ng-star-inserted";
      let aria = nodes[i].getAttribute("aria-label");
      let isScheduled = this.checkSchedule(aria);
      if(isScheduled){
        nodes[i].className += " mat-calendar-body-active";
      }
    }
  }

  private checkSchedule(aria){
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

}
