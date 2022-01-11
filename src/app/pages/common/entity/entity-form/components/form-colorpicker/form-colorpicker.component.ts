import {
  Component, OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  FormColorPickerConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';

@Component({
  selector: 'form-colorpicker',
  templateUrl: './form-colorpicker.component.html',
  styleUrls: ['./form-colorpicker.component.scss'],
})
export class FormColorpickerComponent implements Field, OnInit {
  config: FormColorPickerConfig;
  group: FormGroup;
  fieldShow: string;
  picker = false;

  get colorProxy(): string {
    return this.group.value[this.config.name];
  }

  set colorProxy(val: string) {
    this.group.controls[this.config.name].setValue(val);
  }

  ngOnInit(): void {
    this.config.value = this.group.value[this.config.name];
  }

  cpListener(evt: string, data: string): void {
    this.group.value[this.config.name] = data;
  }

  inputListener(evt: string, data: {
    input: string;
    value: string | number;
    color: string;
  }): void {
    this.group.value[this.config.name] = data;
  }

  togglePicker(): void {
    this.picker = !this.picker;
  }
}
