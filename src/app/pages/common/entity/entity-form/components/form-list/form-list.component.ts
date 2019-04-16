import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { EntityFormService } from '../../services/entity-form.service';

@Component({
  selector: 'form-list',
  templateUrl: './form-list.component.html',
  styleUrls: ['./form-list.component.css'],
})
export class FormListComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  public listsFromArray: FormArray;

  constructor(private entityFormService: EntityFormService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.listsFromArray = this.formBuilder.array([]);
    this.listsFromArray.push(this.entityFormService.createFormGroup(this.config.listFields));
    this.group.controls[this.config.name] = this.listsFromArray;
  }

  add() {
    this.listsFromArray.push(this.entityFormService.createFormGroup(this.config.listFields));
  }

  delete(id) {
    this.listsFromArray.removeAt(id);
  }
}
