import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';
import * as _ from 'lodash';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { EntityFormService } from '../../services/entity-form.service';
import { FieldRelationService } from '../../services/field-relation.service';

@Component({
  selector: 'entity-form-list',
  templateUrl: './form-list.component.html',
  styleUrls: ['./form-list.component.css', '../dynamic-field/dynamic-field.css'],
})
export class FormListComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  listsFromArray: FormArray;

  constructor(private entityFormService: EntityFormService, protected fieldRelationService: FieldRelationService) {}

  ngOnInit() {
    setTimeout(() => {
      this.listsFromArray = this.group.controls[this.config.name] as FormArray;
      if (this.config.addInitialList && this.listsFromArray.length === 0) {
        this.add();
      }
    }, 0);
  }

  add() {
    const templateListField = _.cloneDeep(this.config.templateListField);
    const formGroup = this.entityFormService.createFormGroup(templateListField);
    this.listsFromArray.push(formGroup);
    this.config.listFields.push(templateListField);

    templateListField.forEach((subFieldConfig) => {
      this.fieldRelationService.setRelation(subFieldConfig, formGroup);
    });
  }

  delete(id: number) {
    this.listsFromArray.removeAt(id);
    this.config.listFields.splice(id, 1);
  }
}
