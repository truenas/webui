import { Component, Output, ViewChild, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { EntityFormService } from '../../services/entity-form.service';
import { Field } from '../../models/field.interface';

@Component({
  selector: 'form-label',
  templateUrl: './form-label.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.css'],
})
export class FormLabelComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  constructor(public translate: TranslateService,
    private formService: EntityFormService) {
  }
}
