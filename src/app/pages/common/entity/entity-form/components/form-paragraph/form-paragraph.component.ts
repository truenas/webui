import {Component, ViewContainerRef} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-paragraph',
  templateUrl : './form-paragraph.component.html',
  styleUrls : [ '../dynamic-field/dynamic-field.css' ],
})
export class FormParagraphComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  constructor(public translate: TranslateService) {}
}
