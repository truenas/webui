import {Component, ViewContainerRef} from '@angular/core';
import {FormGroup} from '@angular/forms';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-input',
  templateUrl : './form-input.component.html',
  styleUrls : [ '../dynamic-field/dynamic-field.css' ],
})
export class FormInputComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
}
