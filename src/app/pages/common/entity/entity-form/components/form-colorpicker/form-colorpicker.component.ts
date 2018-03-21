import {Component,AfterViewInit,OnInit,OnChanges} from '@angular/core';
import {FormGroup} from '@angular/forms';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-colorpicker',
  templateUrl : './form-colorpicker.component.html',
  styleUrls:['./form-colorpicker.component.css']
})
export class FormColorpickerComponent implements Field,OnInit,OnChanges{
  //private _config: FieldConfig;
  public config:FieldConfig;
  group: FormGroup;
  //private _group: FormGroup;
  fieldShow: string;
  public picker:boolean = false;
  private _textInput:string = '';

  get textInput(){
    return this._textInput;
  }

  set textInput(val:string){
    this._textInput = val;
    console.log("TEXT INPUT CHANGED!!");
    console.log(val)
  }

  get colorProxy(){
    //return this.config.value;
    return this.group.value[this.config.name];
  }

  set colorProxy(val:string){
    //this._colorProxy = val; 
    this.group.value[this.config.name] = val;
  }

  constructor(){}
  
  /*get group(){
    return this._group;
  }

  set group(grp:FormGroup){
    //let newConf = Object.assign({},conf);
    //console.warn("COLORPICKER VALUE CHANGED!!");
    //console.log(this.group.value);
    //this._config = newConf;
    this._group = grp;
  }*/

  ngOnChanges(changes){
    if(changes.group){
      //this.ngOnInit();
    }

    /*if(changes.config){
      console.warn("COLORPICKER VALUE CHANGED!!");
    }*/
  }

  ngOnInit(){
    this.config.value = this.group.value[this.config.name];
    //this._config.value = this.group.value[this._config.name];
    console.warn(this);
  }

  cpListener(evt:string, data: any): void {
    this.group.value[this.config.name] = data;
  }

  inputListener(evt:string, data:any): void {
    console.log(evt);
    this.group.value[this.config.name] = data;
    console.warn(this.group.controls[this.config.name].valueChanges)//.next(data);

  }

  public onChangeColor(color: string): any {
    /*const hsva = this.cpService.stringToHsva(color);

    const rgba = this.cpService.hsvaToRgba(hsva);

    return this.cpService.rgbaToCmyk(rgba);*/
    console.log(color);
  }

  public togglePicker(){
    this.picker = !this.picker;
  }
}
