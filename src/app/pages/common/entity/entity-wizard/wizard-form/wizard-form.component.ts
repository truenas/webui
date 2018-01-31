import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// import { RestService, WebSocketService } from '../../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EntityFormService } from '../../entity-form/services/entity-form.service';
import { FieldConfig } from '../../entity-form/models/field-config.interface';

@Component({
  selector: 'wizard-entity-form',
  templateUrl: './wizard-form.component.html',
  providers : [ EntityFormService ]
})
export class WizardFormComponent implements OnInit {

  @Input('wizardForm') step: any;
  @Input('index') stepIndex: number;

  protected formGroup: FormGroup;
  protected fieldConfig: FieldConfig[];

  constructor(private _formBuilder: FormBuilder, private entityFormService: EntityFormService) {

  }

  ngOnInit() {
    this.fieldConfig = this.step.config;
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    console.log('hello wizard form', this.stepIndex);

  }

  isShow(id: any): any {
    if (this.step.isBasicMode) {
      if (this.step.advanced_field.indexOf(id) > -1) {
        return false;
      }
    }
    return true;
  }
}
