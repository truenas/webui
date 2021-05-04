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
  template: '',
  providers: [TooltipsService],
})
export class EntityFormConfigurationComponent implements Formconfiguration {
  @ViewChild('embeddedForm', { static: false }) embeddedForm: EntityFormEmbeddedComponent;
  @ViewChild('regularForm', { static: false }) regularForm: EntityFormComponent;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSets;

  private entityEdit: EntityFormComponent;

  title = '';
  afterModalFormClosed: any;
  formType: string;

  _isOneColumnForm = false;
  get isOneColumnForm() {
    return this._isOneColumnForm;
  }

  set isOneColumnForm(value) {
    this._isOneColumnForm = value;
  }

  // EntityForm
  customSubmit?: any;
  queryCall?: any;
  protected updateCall?: any;
  isEntity = true;

  // EntityFormEmbedded (This is for when your form doesn't submit to backend like view configs etc.)
  target: Subject<CoreEvent>;
  data: any;

  preInit() {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    if (this.formType == 'EntityFormComponent' && this.target && !this.customSubmit) {
      this.customSubmit = (values: any) => {
        this.target.next({
          name: 'FormSubmit',
          data: values,
          sender: this,
        });
      };
    }
  }
}
