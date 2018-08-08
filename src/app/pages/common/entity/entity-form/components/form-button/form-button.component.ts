import {Component} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';

@Component({
  selector : 'form-button',
  styleUrls : [ 'form-button.component.scss' ],
  template : `
    <div 
      class="dynamic-field form-button"
      [formGroup]="group">
      <button
        [disabled]="config.disabled"
        type="submit">
        {{ config.label | translate }}
      </button>
    </div>
  `
})
export class FormButtonComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  constructor(public translate: TranslateService) {}
}
