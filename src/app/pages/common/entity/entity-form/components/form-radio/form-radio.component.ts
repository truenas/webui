import {Component} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from 'ng2-translate/ng2-translate';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-radio',
  styleUrls :
      [ 'form-radio.component.scss', '../dynamic-field/dynamic-field.css' ],
  templateUrl : './form-radio.component.html',
})
export class FormRadioComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  constructor(public translate: TranslateService) {}
}
