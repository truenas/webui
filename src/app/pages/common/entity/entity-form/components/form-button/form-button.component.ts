import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { FormButtonConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';

@Component({
  selector: 'form-button',
  templateUrl: './form-button.component.html',
})
export class FormButtonComponent implements Field {
  config: FormButtonConfig;
  group: FormGroup;
  fieldShow: string;
  constructor(public translate: TranslateService) {}
}
