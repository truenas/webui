import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormArray } from '@angular/forms';
import * as _ from 'lodash';
import { FormListConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from 'app/modules/entity/entity-form/services/field-relation.service';

@Component({
  selector: 'ix-entity-form-list',
  templateUrl: './form-list.component.html',
  styleUrls: ['./form-list.component.scss', '../dynamic-field/dynamic-field.scss'],
})
export class FormListComponent implements Field, OnInit {
  config: FormListConfig;
  group: UntypedFormGroup;
  fieldShow: string;

  listsFromArray: UntypedFormArray;

  constructor(private entityFormService: EntityFormService, protected fieldRelationService: FieldRelationService) {}

  ngOnInit(): void {
    this.listsFromArray = this.group.get(this.config.name) as UntypedFormArray;
    if (this.config.addInitialList && this.listsFromArray.length === 0) {
      this.add();
    }
  }

  add(): void {
    const templateListField = _.cloneDeep(this.config.templateListField);
    const formGroup = this.entityFormService.createFormGroup(templateListField);
    this.listsFromArray.push(formGroup);
    this.config.listFields.push(templateListField);

    templateListField.forEach((subFieldConfig) => {
      this.fieldRelationService.setRelation(subFieldConfig, formGroup);
    });
  }

  delete(id: number): void {
    this.listsFromArray.removeAt(id);
    this.config.listFields.splice(id, 1);
  }
}
