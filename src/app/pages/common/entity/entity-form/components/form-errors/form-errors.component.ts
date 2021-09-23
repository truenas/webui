import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'form-errors',
  templateUrl: './form-errors.component.html',
})
export class FormErrorsComponent {
  @Input() control: AbstractControl;
  @Input() config: FieldConfig;
}
