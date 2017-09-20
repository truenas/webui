import { Component, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';
import * as _ from 'lodash';

@Component({
  selector: 'form-toggle-button',
  templateUrl: './form-toggle-button.component.html',
  styleUrls: ['./form-toggle-button.component.css']
})
export class FormToggleButtonComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  public groupValue: Array < any >= [];

  check(item) {
    let target = _.findIndex(this.groupValue, _.unary(_.partialRight(_.includes, item)));
    if (target > -1) {
      this.groupValue.splice(target, 1);
    } else {
      this.groupValue.push(item);
    }

    let control = this.group.controls[this.config.name];
    control.setValue(this.groupValue);
  }
}
