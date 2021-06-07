import {
  Component,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';

@Component({
  selector: 'form-label',
  templateUrl: './form-label.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormLabelComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  constructor(public translate: TranslateService,
    private formService: EntityFormService) {
  }
}
