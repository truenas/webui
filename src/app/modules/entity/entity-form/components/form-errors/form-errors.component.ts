import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'ix-form-errors',
  templateUrl: './form-errors.component.html',
})
export class FormErrorsComponent {
  @Input() control: AbstractControl;
  @Input() config: FieldConfig;
}
