import {Component, OnInit } from '@angular/core';
import {FormGroup, FormControl, FormArray, FormBuilder, AbstractControl} from '@angular/forms';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {EntityFormService} from '../../services/entity-form.service';
import { config } from 'rxjs';

@Component({
  selector : 'form-list',
  templateUrl : './form-list.component.html',
})
export class FormListComponent implements Field, OnInit{
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  public listLength = 1;
  public listsFromArray: FormArray;
  public formlistControl: AbstractControl;

  constructor(private entityFormService: EntityFormService, private formBuilder: FormBuilder,){}

  ngOnInit() {
    this.listsFromArray = this.formBuilder.array([]);
    this.listsFromArray.push(this.entityFormService.createFormGroup(this.config.listFields));

    this.formlistControl = this.group.controls[this.config.name];

    this.listsFromArray.valueChanges.subscribe((res)=> {
        this.formlistControl.setValue(this.getListControlValue());
    })
  }

  getListControlValue() {
    const listsValue = [];
    for (let i = 0; i < this.listsFromArray.controls.length; i++) {
        const listValue = [];
        const listFormGroup = this.listsFromArray.controls[i] as FormGroup;
        for (const prop in listFormGroup.controls) {
          listValue[prop] = listFormGroup.controls[prop].value;
        }
        listsValue.push(listValue);
    }
    return listsValue;
  }

  add() {
    this.listsFromArray.push(this.entityFormService.createFormGroup(this.config.listFields));
  }

  delete(id) {
    this.listsFromArray.removeAt(id);
  }
}
