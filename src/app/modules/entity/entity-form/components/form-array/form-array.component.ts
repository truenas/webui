import { Component } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { FormArrayConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  templateUrl: './form-array.component.html',
  styleUrls: ['./form-array.component.scss'],
})
export class FormArrayComponent implements Field {
  config: FormArrayConfig;
  group: FormGroup;
  fieldShow: string;

  asFormArray(control: AbstractControl): FormArray {
    return control as FormArray;
  }
}
