import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Component, Input, OnInit } from '@angular/core';

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
import { DatePipe } from '@angular/common';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-entity-dialog',
  templateUrl: './entity-dialog.component.html',
  styles: [],
  providers: [EntityFormService, DatePipe, FieldRelationService]
})
export class EntityDialogComponent implements OnInit {

  @Input() conf: DialogFormConfiguration;

  public title: string;
  public warning: string;
  public fieldConfig: Array < FieldConfig > ;
  public formGroup: FormGroup;
  public saveButtonText: string;
  public cancelButtonText = "Cancel";
  public detachButtonText: string;
  public getKeyButtonText: string;
  public error: string;
  public formValue: any;
  public showPassword = false;
  public parent: any;
  public submitEnabled = true;
  public instructions: string;

  constructor(public dialogRef: MatDialogRef < EntityDialogComponent >,
    protected translate: TranslateService,
    protected entityFormService: EntityFormService,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    public mdDialog: MatDialog,
    public snackBar: MatSnackBar,
    public datePipe: DatePipe,
    protected fieldRelationService: FieldRelationService) {}

  ngOnInit() {
    this.translate.get(this.conf.title).subscribe(title => {
      this.title = title;
    });

    this.fieldConfig = this.conf.fieldConfig;
    
    if(this.conf.parent) {
      this.parent = this.conf.parent;
    }

    if (this.conf.preInit) {
      this.conf.preInit(this);
    }

    if (this.conf.saveButtonText) {
      this.saveButtonText = this.conf.saveButtonText;
    }
    if (this.conf.cancelButtonText) {
      this.cancelButtonText = this.conf.cancelButtonText;
    }
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    for (const i in this.fieldConfig) {
      const config = this.fieldConfig[i];
      if (config.relation.length > 0) {
        this.fieldRelationService.setRelation(config, this.formGroup, this.fieldConfig);
      }
    }

    if(this.conf.afterInit) {
      this.conf.afterInit(this);
    }
    this.instructions = T(`Enter <strong>${ this.conf['name'] }</strong> below to confirm.`)
  }

  submit() {
    this.clearErrors();
    this.formValue = _.cloneDeep(this.formGroup.value);

    if (this.conf.customSubmit) {
      this.conf.customSubmit(this);
    } else {
      this.loader.open();
      if (this.conf.method_rest) {
        this.rest.post(this.conf.method_rest, {
          body: JSON.stringify(this.formValue)
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
    this.error = null;
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f]['errors'] = '';
      this.fieldConfig[f]['hasErrors'] = false;
    }
  }

  togglePW() {
    let inputs = document.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
      if (!inputs[i].placeholder.toLowerCase().includes('current') && 
          !inputs[i].placeholder.toLowerCase().includes('root')) {
        if (inputs[i].placeholder.toLowerCase().includes('password') || 
        inputs[i].placeholder.toLowerCase().includes('passphrase') ||
        inputs[i].placeholder.toLowerCase().includes('secret')) {
          if (inputs[i].type === 'password') {
            inputs[i].type = 'text';
          } else {
            inputs[i].type = 'password';
          }
        }
      }
    }
    this.showPassword = !this.showPassword;
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.conf['name'])
  }
}
