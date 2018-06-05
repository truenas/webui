import { MatDialog, MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Component, Output, Input, EventEmitter, OnInit } from '@angular/core';

import { EntityFormService } from '../entity-form//services/entity-form.service';
import { FieldRelationService } from '../entity-form/services/field-relation.service';
import { FieldConfig } from '../entity-form/models/field-config.interface';
import { FormGroup } from '@angular/forms';
import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../utils';
import * as _ from 'lodash';
import { DialogFormConfiguration } from './dialog-form-configuration.interface';

@Component({
  selector: 'app-entity-dialog',
  templateUrl: './entity-dialog.component.html',
  providers: [EntityFormService]
})
export class EntityDialogComponent implements OnInit {

  @Input('conf') conf: DialogFormConfiguration;

  public title: string;
  public fieldConfig: Array < FieldConfig > ;
  public formGroup: FormGroup;
  public saveButtonText: string = "Ok";
  public cancelButtonText: string = "Cancel";

  constructor(public dialogRef: MatDialogRef < EntityDialogComponent >,
    protected translate: TranslateService,
    protected entityFormService: EntityFormService,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected loader: AppLoaderService) {}

  ngOnInit() {
    this.title = this.conf.title;
    this.fieldConfig = this.conf.fieldConfig;

    if (this.conf.saveButtonText) {
      this.saveButtonText = this.conf.saveButtonText;
    }
    if (this.conf.cancelButtonText) {
      this.cancelButtonText = this.conf.cancelButtonText;
    }
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
  }

  submit() {
    this.clearErrors();
    let value = _.cloneDeep(this.formGroup.value);
    this.dialogRef.close(true);

    if (this.conf.customSubmit) {
      this.conf.customSubmit(value);
    } else {
      this.loader.open();
      if (this.conf.method_rest) {
        this.rest.post(this.conf.method_rest, {
          body: JSON.stringify(value)
        }).subscribe(
          (res) => {
            this.loader.close();
            this.dialogRef.close(true);
          },
          (res) => {
            this.loader.close();
            new EntityUtils().handleError(this, res);
          }
        );
      } else if (this.conf.method_ws) {
        // ws call
      }
    }
  }

  cancel() {
    this.dialogRef.close(false);
    this.clearErrors();
  }

  clearErrors() {
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f].errors = '';
      this.fieldConfig[f].hasErrors = false;
    }
  }
}
