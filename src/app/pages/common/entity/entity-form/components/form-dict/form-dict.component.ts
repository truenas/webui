import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';
import * as _ from 'lodash';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { EntityFormService } from '../../services/entity-form.service';
import { FieldRelationService } from '../../services/field-relation.service';

@Component({
  selector: 'entity-form-dict',
  templateUrl: './form-dict.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.css'],
})
export class FormDictComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  dictFormGroup: FormGroup;

  constructor(private entityFormService: EntityFormService, protected fieldRelationService: FieldRelationService) {}

  ngOnInit(): void {
    this.dictFormGroup = this.group.controls[this.config.name] as FormGroup;
  }
}
