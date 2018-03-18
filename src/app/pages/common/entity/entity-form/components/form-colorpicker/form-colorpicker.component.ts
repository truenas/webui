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
      console.warn("COLORPICKER VALUE CHANGED!!");
      console.log(this.config);
    }

    /*if(changes.config){
      console.warn("COLORPICKER VALUE CHANGED!!");
    }*/
  }

  ngOnInit(){
    this.config.value = this.group.value[this.config.name];
    //this._config.value = this.group.value[this._config.name];
  }

  cpListener(evt:string, data: any): void {
    console.log("Color Picker Changed");
    console.log(evt);
    console.log(data);
    this.group.value[this.config.name] = data;
  }

  inputListener(evt:string, data:any): void {
    console.log("Input Value Changed");
    console.log(evt);
    console.log(data);
    this.group.value[this.config.name] = data;
  }

  public onChangeColor(color: string): any {
    /*const hsva = this.cpService.stringToHsva(color);

    const rgba = this.cpService.hsvaToRgba(hsva);

    return this.cpService.rgbaToCmyk(rgba);*/
    console.log(color);
  }

  public togglePicker(){
    console.log(this.picker);
    this.picker = !this.picker;
  }
}
