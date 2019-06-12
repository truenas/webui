import {Component, ViewContainerRef, ViewChild, ElementRef} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-textarea-button',
  templateUrl : './form-textarea-button.component.html',
  styleUrls : [ '../dynamic-field/dynamic-field.css' ],
})
export class FormTextareaButtonComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  @ViewChild("textAreaSSH", { static: true})
  textAreaSSH: ElementRef;

  constructor(public translate: TranslateService) {}

  customEventMethod($event) {

    if( this.config.customEventMethod !== undefined && this.config.customEventMethod != null) {
      this.config.customEventMethod({ event:  $event, textAreaSSH: this.textAreaSSH  });
    }

    $event.preventDefault();

  }
}
