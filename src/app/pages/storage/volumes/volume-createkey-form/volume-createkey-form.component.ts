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
import { WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { EncryptionService } from 'app/services/encryption.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-createpassphrase-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class VolumeCreatekeyFormComponent implements FormConfiguration {
  saveSubmitText = T('Create Passphrase');

  queryCall: 'pool.query' = 'pool.query';
  queryKey = 'id';
  route_return: string[] = ['storage', 'pools'];
  isNew = false;
  isEntity = true;
  poolName: string;
  admin_pw = '';
  entityData = {
    name: '',
    passphrase: '',
    passphrase2: '',
  };

  fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      isHidden: true,
    }, {
      type: 'paragraph',
      name: 'encrypt-headline',
      paraText: '<i class="material-icons">lock</i>' + helptext.changekey_headline,
    }, {
      type: 'paragraph',
      name: 'createkey-instructions',
      paraText: helptext.changekey_instructions,
    }, {
      type: 'input',
      inputType: 'password',
      togglePw: true,
      name: 'adminpw',
      placeholder: helptext.changekey_adminpw_placeholder,
      tooltip: helptext.changekey_adminpw_tooltip,
      validation: helptext.changekey_adminpw_validation,
      required: true,
    }, {
      type: 'input',
      inputType: 'password',
      name: 'passphrase',
      placeholder: helptext.createkey_passphrase_placeholder,
      tooltip: helptext.createkey_passphrase_tooltip,
      validation: helptext.createkey_passphrase_validation,
      required: true,
      togglePw: true,
    },
  ];

  custActions = [
    {
      id: 'download_encrypt_key',
      name: T('Download Encryption Key'),
      disabled: true,
      function: () => {
        this.ws.call('auth.check_user', ['root', this.admin_pw]).pipe(untilDestroyed(this)).subscribe((res) => {
          if (res) {
            this.encryptionService.openEncryptDialog(this.pk, this.route_return, this.poolName);
          } else {
            this.dialogService.info('Error', 'The administrator password is incorrect.', '340px');
          }
        });
      },
    },
    {
      id: 'custom_cancel',
      name: T('Cancel'),
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
    private mdDialog: MatDialog,
    private encryptionService: EncryptionService,
  ) {}

  preInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    entityForm.formGroup.controls['adminpw'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      this.admin_pw = res;
      const btn = document.getElementById('cust_button_Download Encryption Key') as HTMLInputElement;
      btn.disabled = this.admin_pw === '';
    });
  }

  customSubmit(value: any): void {
    this.ws.call('auth.check_user', ['root', value.adminpw]).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.encryptionService.setPassphrase(this.pk, value.passphrase, value.adminpw,
          value.name, this.route_return, false, true, 'created for');
      } else {
        this.dialogService.info('Error', 'The administrator password is incorrect.', '340px');
      }
    });
  }
}
