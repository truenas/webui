import { Component, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'form-input',
  templateUrl: './form-slider.component.html',
})
export class FormSliderComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
}
