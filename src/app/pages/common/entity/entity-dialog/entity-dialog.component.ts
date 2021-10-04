import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { WebSocketService } from 'app/services/ws.service';
import { FieldConfig } from '../entity-form/models/field-config.interface';
import { EntityFormService } from '../entity-form/services/entity-form.service';
import { FieldRelationService } from '../entity-form/services/field-relation.service';
import { EntityUtils } from '../utils';
import { DialogFormConfiguration } from './dialog-form-configuration.interface';

@UntilDestroy()
@Component({
  selector: 'app-entity-dialog',
  templateUrl: './entity-dialog.component.html',
  styleUrls: ['./entity-dialog.component.scss'],
  providers: [EntityFormService, DatePipe, FieldRelationService],
})
export class EntityDialogComponent<P = any> implements OnInit {
  @Input() conf: DialogFormConfiguration<P>;

  title: string;
  warning: string;
  fieldConfig: FieldConfig[];
  formGroup: FormGroup;
  saveButtonText: string;
  cancelButtonText = 'Cancel';
  detachButtonText: string;
  getKeyButtonText: string;
  error: string;
  formValue: any;
  showPassword = false;
  /**
   * @deprecated Capture parent with an arrow function instead
   */
  parent: P;
  submitEnabled = true;
  instructions: string;
  confirmCheckbox = false;

  constructor(
    public dialogRef: MatDialogRef <EntityDialogComponent>,
    protected translate: TranslateService,
    protected entityFormService: EntityFormService,
    public ws: WebSocketService,
    public loader: AppLoaderService,
    public mdDialog: MatDialog,
    public datePipe: DatePipe,
    protected fieldRelationService: FieldRelationService,
  ) {}

  ngOnInit(): void {
    this.title = this.translate.instant(this.conf.title);

    this.fieldConfig = this.conf.fieldConfig;

    if (this.conf.parent) {
      this.parent = this.conf.parent;
    }

    if (this.conf.confirmCheckbox) {
      this.confirmCheckbox = this.conf.confirmCheckbox;
      this.submitEnabled = false;
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

    this.fieldConfig.forEach((config) => {
      if (config.relation.length > 0) {
        this.fieldRelationService.setRelation(config, this.formGroup);
      }
    });

    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }
    this.instructions = this.translate.instant('Enter <strong>{name}</strong> below to confirm.', { name: this.conf.name });
  }

  submit(): void {
    this.clearErrors();
    this.formValue = _.cloneDeep(this.formGroup.value);

    if (this.conf.customSubmit) {
      this.conf.customSubmit(this);
    } else {
      this.loader.open();
      this.ws.call(this.conf.method_ws, [this.formValue]).pipe(untilDestroyed(this)).subscribe(
        () => {},
        (e) => {
          this.loader.close();
          this.dialogRef.close(false);
          new EntityUtils().handleWSError(this, e);
        },
        () => {
          this.loader.close();
          this.dialogRef.close(true);
        },
      );
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
    this.clearErrors();
  }

  clearErrors(): void {
    this.error = null;
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f]['errors'] = '';
      this.fieldConfig[f]['hasErrors'] = false;
    }
  }

  togglePW(): void {
    const inputs = document.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
      if (!inputs[i].placeholder.toLowerCase().includes('current')
          && !inputs[i].placeholder.toLowerCase().includes('root')) {
        if (inputs[i].placeholder.toLowerCase().includes('password')
        || inputs[i].placeholder.toLowerCase().includes('passphrase')
        || inputs[i].placeholder.toLowerCase().includes('secret')) {
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

  setDisabled(name: string, disable: boolean, hide?: boolean): void {
    // if field is hidden, disable it too
    if (hide) {
      disable = hide;
    } else {
      hide = false;
    }

    this.fieldConfig = this.fieldConfig.map((item) => {
      if (item.name === name) {
        item.disabled = disable;
        item['isHidden'] = hide;
      }
      return item;
    });

    if (this.formGroup.controls[name]) {
      const method = disable ? 'disable' : 'enable';
      this.formGroup.controls[name][method]();
    }
  }

  toggleSubmit(data: MatCheckboxChange): void {
    this.submitEnabled = data.checked;
  }
}
