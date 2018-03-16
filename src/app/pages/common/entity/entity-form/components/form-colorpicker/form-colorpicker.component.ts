import {Component,AfterViewInit,OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-colorpicker',
  templateUrl : './form-colorpicker.component.html',
  styleUrls:['./form-colorpicker.component.css']
})
export class FormColorpickerComponent implements Field,OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  public picker:boolean = false;

  constructor(){}

  ngOnInit(){
    this.config.value = this.group.value[this.config.name];
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
