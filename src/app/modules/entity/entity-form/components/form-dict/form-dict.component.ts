import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FormDictConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  templateUrl: './form-dict.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormDictComponent implements Field, OnInit {
  config: FormDictConfig;
  group: UntypedFormGroup;
  fieldShow: string;

  dictFormGroup: UntypedFormGroup;

  ngOnInit(): void {
    this.dictFormGroup = this.group.controls[this.config.name] as UntypedFormGroup;
  }
}
