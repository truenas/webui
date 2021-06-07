import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';

@Component({
  selector: 'form-paragraph',
  templateUrl: './form-paragraph.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormParagraphComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  constructor(public translate: TranslateService) {}
}
