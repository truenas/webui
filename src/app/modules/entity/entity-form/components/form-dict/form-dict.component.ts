import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormDictConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';
import { FieldRelationService } from 'app/modules/entity/entity-form/services/field-relation.service';

@Component({
  selector: 'entity-form-dict',
  templateUrl: './form-dict.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormDictComponent implements Field, OnInit {
  config: FormDictConfig;
  group: FormGroup;
  fieldShow: string;

  dictFormGroup: FormGroup;

  constructor(protected fieldRelationService: FieldRelationService) {}

  ngOnInit(): void {
    this.dictFormGroup = this.group.controls[this.config.name] as FormGroup;
  }
}
