import {
  ApplicationRef,
  Component,
  Injector,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import helptext from 'app/helptext/storage/volumes/volume-key';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import {
  FieldConfig, FormParagraphConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { WebSocketService, StorageService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { EncryptionService } from 'app/services/encryption.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-addkey-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class VolumeAddkeyFormComponent implements FormConfiguration {
  saveSubmitText = T('Add Recovery Key');

  queryCall: 'pool.query' = 'pool.query';
  queryKey = 'id';
  route_return: string[] = ['storage', 'pools'];
  isNew = false;
  isEntity = true;
  poolName: string;
  admin_pw = '';
  button_disabled = true;
  entityData = {
    name: '',
    passphrase: '',
  };

  fieldConfig: FieldConfig[] = [
    {
      type: 'paragraph',
      name: 'encrypt-headline',
      paraText: '<i class="material-icons">lock</i>' + helptext.add_key_headline,
    }, {
      type: 'paragraph',
      name: 'addkey-instructions',
      paraText: helptext.add_key_instructions,
    },
    {
      type: 'input',
      name: 'name',
      isHidden: true,
      validation: helptext.add_key_name_validation,
      required: true,
    }, {
      type: 'input',
      inputType: 'password',
      name: 'password',
      placeholder: helptext.add_key_password_placeholder,
      tooltip: helptext.add_key_password_tooltip,
      validation: helptext.add_key_password_validation,
      required: true,
    },
  ];

  custActions = [
    {
      id: 'delete_recovery_key',
      name: helptext.add_key_invalid_button,
      disabled: this.button_disabled,
      function: () => {
        this.ws.call('auth.check_user', ['root', this.admin_pw]).pipe(untilDestroyed(this)).subscribe((res) => {
          if (res) {
            this.encryptionService.deleteRecoveryKey(this.pk, this.admin_pw, this.poolName, this.route_return);
          } else {
            this.dialogService.info('Error', 'The administrator password is incorrect.', '340px');
          }
        });
      },
    },
    {
      id: 'custom_cancel',
      name: helptext.add_key_custom_cancel,
      function: () => {
        this.router.navigate(new Array('/').concat(
          this.route_return,
        ));
      },
    }];

  resourceTransformIncomingRestData(data: Pool): Pool {
    this.poolName = data.name;
    const config: FormParagraphConfig = _.find(this.fieldConfig, { name: 'encrypt-headline' });
    config.paraText += ` <em>${this.poolName}</em>`;
    return data;
  }

  pk: any;
  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected storage: StorageService,
    protected mdDialog: MatDialog,
    protected encryptionService: EncryptionService,
  ) {}

  preInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    entityForm.formGroup.controls['password'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      this.admin_pw = res;
      const btn = <HTMLInputElement> document.getElementById('cust_button_Invalidate Existing Key');
      btn.disabled = this.admin_pw === '';
    });
  }

  customSubmit(value: any): void {
    this.ws.call('auth.check_user', ['root', value.password]).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.encryptionService.makeRecoveryKey(this.pk, value.name, this.route_return);
      } else {
        this.dialogService.info('Error', 'The administrator password is incorrect.', '340px');
      }
    });
  }
}
