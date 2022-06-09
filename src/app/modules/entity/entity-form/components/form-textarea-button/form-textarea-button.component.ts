import {
  Component, ViewChild, ElementRef,
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { FormTextareaButtonConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  templateUrl: './form-textarea-button.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormTextareaButtonComponent implements Field {
  config: FormTextareaButtonConfig;
  group: UntypedFormGroup;
  fieldShow: string;

  @ViewChild('textAreaSsh', { static: true })
  textAreaSsh: ElementRef;

  constructor(public translate: TranslateService) {}

  customEventMethod($event: MouseEvent): void {
    if (this.config.customEventMethod !== undefined && this.config.customEventMethod !== null) {
      this.config.customEventMethod({ event: $event, textAreaSSH: this.textAreaSsh });
    }

    $event.preventDefault();
  }
}
