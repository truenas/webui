import {Component,AfterViewInit,OnInit,OnChanges} from '@angular/core';
import {FormGroup} from '@angular/forms';
//import {MatDatepickerModule} from '@angular/material';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

interface CronPreset {
  label:string;
  value:string;
}

@Component({
  selector : 'form-scheduler',
  templateUrl : './form-scheduler.component.html',
  styleUrls:['./form-scheduler.component.css']
})
export class FormSchedulerComponent implements Field,OnInit,OnChanges{
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
  }

  ngOnChanges(changes){
    if(changes.group){
    }
  }

  ngOnInit(){
    this.config.value = this.group.value[this.config.name];
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
}
