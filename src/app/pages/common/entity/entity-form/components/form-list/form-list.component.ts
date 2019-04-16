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
  public listFromArray: FormArray;
  public listControl: AbstractControl;

  constructor(private entityFormService: EntityFormService, private formBuilder: FormBuilder,){}

  ngOnInit() {
    console.log(this.config, this.group);
    this.listFromArray = this.formBuilder.array([]);
    this.listFromArray.push(this.entityFormService.createFormGroup(this.config.listFields));
    console.log(this.listFromArray);
    this.listControl = this.group.controls[this.config.name];
    console.log(this.listControl);
    
    this.listFromArray.valueChanges.subscribe((res)=> {
        console.log(res);
        this.listControl.setValue(this.getListControlValue());
    })
  }

  getListControlValue() {
    for (let i = 0; i < this.listFromArray.controls.length; i++) {
        console.log(this.listFromArray.controls[i]);
        
    }
  }
  add() {
    this.listFromArray.push(this.entityFormService.createFormGroup(this.config.listFields));
    console.log(this.listFromArray);
  }

  delete(id) {
    this.listFromArray.removeAt(id);
  }
}
