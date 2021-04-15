import {
  Component, AfterViewInit, OnInit, OnChanges,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'form-colorpicker',
  templateUrl: './form-colorpicker.component.html',
  styleUrls: ['./form-colorpicker.component.css'],
})
export class FormColorpickerComponent implements Field, OnInit, OnChanges {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  picker = false;
  private _textInput = '';

  get textInput() {
    return this._textInput;
  }

  set textInput(val: string) {
    this._textInput = val;
    console.log('TEXT INPUT CHANGED!!');
    console.log(val);
  }

  get colorProxy() {
    return this.group.value[this.config.name];
  }

  set colorProxy(val: string) {
    this.group.controls[this.config.name].setValue(val);
  }

  constructor() {}

  ngOnChanges(changes) {
    if (changes.group) {
    }
  }

  ngOnInit() {
    this.config.value = this.group.value[this.config.name];
  }

  cpListener(evt: string, data: any): void {
    this.group.value[this.config.name] = data;
  }

  inputListener(evt: string, data: any): void {
    console.log(evt);
    this.group.value[this.config.name] = data;
  }

  onChangeColor(color: string): any {
    // console.log(color);
  }

  togglePicker() {
    this.picker = !this.picker;
  }
}
