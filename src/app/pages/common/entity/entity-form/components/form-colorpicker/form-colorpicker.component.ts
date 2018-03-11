import {Component} from '@angular/core';
import {FormGroup} from '@angular/forms';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-colorpicker',
  templateUrl : './form-colorpicker.component.html',
  styleUrls:['./form-colorpicker.component.css']
})
export class FormColorpickerComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  public picker:boolean = false;

  constructor(){
  }
  public togglePicker(){
    this.picker = !this.picker;
  }
}
