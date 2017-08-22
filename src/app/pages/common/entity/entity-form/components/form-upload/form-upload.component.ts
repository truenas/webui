import {Component, ViewContainerRef} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { FileUploader } from 'ng2-file-upload';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-upload',
  templateUrl : './form-upload.component.html',
  styleUrls : [ '../dynamic-field/dynamic-field.css' ],
})
export class FormUploadComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
}
