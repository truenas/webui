import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { Subject } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';

import { TooltipsService, WebSocketService } from 'app/services';
import { EntityFormEmbeddedComponent } from './entity-form-embedded.component';
import { EntityFormComponent, Formconfiguration } from './entity-form.component';
import { FieldConfig } from './models/field-config.interface';
import { FieldSets } from './classes/field-sets';
import { ipv4Validator, ipv6Validator } from './validators/ip-validation';


@Component({
  selector: 'entity-form-configuration',
  template: ``,
  providers: [TooltipsService],
})
export class EntityFormConfigurationComponent implements Formconfiguration {

  @ViewChild('embeddedForm', {static : false}) embeddedForm: EntityFormEmbeddedComponent;
  @ViewChild('regularForm', {static : false}) regularForm: EntityFormComponent;

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSets; 

  private entityEdit: EntityFormComponent;
  
  public title = '';
  public afterModalFormClosed;
  public formType: string;

  _isOneColumnForm: boolean = false;
  get isOneColumnForm(){
    return this._isOneColumnForm;
  }

  set isOneColumnForm(value){
    this._isOneColumnForm = value;
  }

  // EntityForm
  public customSubmit?;
  public queryCall?;
  protected updateCall?;
  public isEntity = true;

  // EntityFormEmbedded (This is for when your form doesn't submit to backend like view configs etc.)
  public target: Subject<CoreEvent>;
  public data: any;

  constructor() {
  }

  preInit(entity) {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    if(this.formType == 'EntityFormComponent' && this.target && !this.customSubmit){
      this.customSubmit = (values) => {
        this.target.next({
          name: 'FormSubmit',
          data: values,
          sender: this
        });
      }
    }
  }

}
