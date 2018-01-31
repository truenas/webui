import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from '../../../../services';
import { AbstractControl, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { FieldConfig } from '../../entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../entity/entity-form/services/field-relation.service';

@Component({
  selector: 'entity-wizard',
  templateUrl: 'entity-wizard.component.html',
  providers: [ EntityFormService, FieldRelationService ]
})
export class EntityWizardComponent implements OnInit {

  @Input('conf') conf: any;

  isLinear = false;
  formGroup: FormGroup;

  get formArray(): AbstractControl | null { return this.formGroup.get('formArray'); }

  constructor(protected rest: RestService, protected ws: WebSocketService,
  			private formBuilder: FormBuilder, private entityFormService: EntityFormService) {

  }

  ngOnInit() {
    console.log(this.conf);

    let wizardformArray = this.formBuilder.array([]);
    for (let i in this.conf.wizardConfig) {
      wizardformArray.push(this.entityFormService.createFormGroup(this.conf.wizardConfig[i].fieldConfig));
    }

    this.formGroup = this.formBuilder.group({
      formArray: wizardformArray
    });

    console.log(this.formGroup);
  }

  isShow(id: any): any {
    if (this.conf.isBasicMode) {
      if (this.conf.advanced_field.indexOf(id) > -1) {
        return false;
      }
    }
    return true;
  }
}
