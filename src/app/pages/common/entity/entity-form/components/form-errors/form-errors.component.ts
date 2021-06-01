import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FieldConfig } from '../../models/field-config.interface';

@UntilDestroy()
@Component({
  selector: 'form-errors',
  templateUrl: './form-errors.component.html',
})
export class FormErrorsComponent {
  @Input()control: FormControl;
  @Input()config: FieldConfig;
}
