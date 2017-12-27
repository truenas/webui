import {Component} from '@angular/core';
import {FormGroup} from '@angular/forms';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-datepicker',
  templateUrl : './form-datepicker.component.html',
})
export class FormDatepickerComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
}
