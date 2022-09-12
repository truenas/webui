import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from 'app/modules/entity/entity-form/services/field-relation.service';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-entity-dialog',
  templateUrl: './entity-dialog.component.html',
  styleUrls: ['./entity-dialog.component.scss'],
  providers: [EntityFormService, DatePipe, FieldRelationService],
})
export class EntityDialogComponent implements OnInit {
  @Input() conf: DialogFormConfiguration;

  title: string;
  warning: string;
  fieldConfig: FieldConfig[];
  formGroup: UntypedFormGroup;
  saveButtonText: string;
  cancelButtonText = 'Cancel';
  error: string;
  formValue: any;
  showPassword = false;
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
    protected fieldRelationService: FieldRelationService,
  ) {}

  ngOnInit(): void {
    this.title = this.translate.instant(this.conf.title);

    this.fieldConfig = this.conf.fieldConfig;

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
      this.ws.call(this.conf.method_ws, [this.formValue]).pipe(untilDestroyed(this)).subscribe({
        error: (error) => {
          this.loader.close();
          this.dialogRef.close(false);
          new EntityUtils().handleWsError(this, error);
        },
        complete: () => {
          this.loader.close();
          this.dialogRef.close(true);
        },
      });
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
    this.clearErrors();
  }

  clearErrors(): void {
    this.error = null;
    this.fieldConfig.forEach((config) => {
      config['errors'] = '';
      config['hasErrors'] = false;
    });
  }

  togglePassword(): void {
    const inputs = document.getElementsByTagName('input');
    for (const input of inputs) {
      if (!input.placeholder.toLowerCase().includes('current')
          && !input.placeholder.toLowerCase().includes('root')) {
        if (input.placeholder.toLowerCase().includes('password')
        || input.placeholder.toLowerCase().includes('passphrase')
        || input.placeholder.toLowerCase().includes('secret')) {
          if (input.type === 'password') {
            input.type = 'text';
          } else {
            input.type = 'password';
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

  isButtonVisible(field: FieldConfig): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
    return 'hideButton' in field && field.hideButton === false;
  }
}
