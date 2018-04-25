import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'form-combobox',
  styleUrls: ['form-combobox.component.scss', '../dynamic-field/dynamic-field.css'],
  templateUrl: './form-combobox.component.html',
})
export class FormComboboxComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  constructor(public translate: TranslateService) {}

  onChangeOption(value) {
    this.group.controls[this.config.name].setValue(value);
  }
}
