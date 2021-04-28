import { Component, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'form-checkbox',
  styleUrls:
      ['form-checkbox.component.scss', '../dynamic-field/dynamic-field.css'],
  templateUrl: './form-checkbox.component.html',
})
export class FormCheckboxComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  constructor(public translate: TranslateService) {}

  checkboxUpdate() {
    if (this.config.updater && this.config.parent) {
      this.config.updater(this.config.parent);
    }
  }

  onChangeCheckbox($event: MatCheckboxChange) {
    if (this.config.onChange !== undefined && this.config.onChange != null) {
      this.config.onChange({ event: $event });
    }
  }

  preventClick($event: MouseEvent) {
    $event.preventDefault();
    return true;
  }
}
