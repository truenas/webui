import { Component, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'form-toggle-button',
  templateUrl: './form-toggle-button.component.html',
})
export class FormToggleButtonComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
}
