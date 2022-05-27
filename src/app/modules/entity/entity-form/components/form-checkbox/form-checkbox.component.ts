import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { TranslateService } from '@ngx-translate/core';
import { FormCheckboxConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  selector: 'ix-form-checkbox',
  styleUrls:
      ['form-checkbox.component.scss', '../dynamic-field/dynamic-field.scss'],
  templateUrl: './form-checkbox.component.html',
})
export class FormCheckboxComponent implements Field {
  config: FormCheckboxConfig;
  group: FormGroup;
  fieldShow: string;

  constructor(public translate: TranslateService) {}

  checkboxUpdate(): void {
    if (this.config.updater && this.config.parent) {
      this.config.updater(this.config.parent);
    }
  }

  onChangeCheckbox($event: MatCheckboxChange): void {
    if (this.config.onChange !== undefined && this.config.onChange !== null) {
      this.config.onChange({ event: $event });
    }
  }

  preventClick($event: MouseEvent): boolean {
    $event.preventDefault();
    return true;
  }
}
