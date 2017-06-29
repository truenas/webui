import { Component, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Field } from '../../models/field.interface';
import { FieldConfig } from '../../models/field-config.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'form-array',
  templateUrl: './form-array.component.html',
})
export class FormArrayComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
}
