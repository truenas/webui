import {
  ApplicationRef,
  Component,
  Injector,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import helptext from 'app/helptext/storage/volumes/volume-key';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import {
  FieldConfig, FormParagraphConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { EncryptionService } from 'app/services/encryption.service';

@UntilDestroy()
@Component({
  selector: 'app-createpassphrase-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class VolumeCreatekeyFormComponent implements FormConfiguration {
  saveSubmitText = this.translate.instant('Create Passphrase');

  queryCall = 'pool.query' as const;
  queryKey = 'id';
  routeReturn: string[] = ['storage', 'pools'];
  isNew = false;
  isEntity = true;
  poolName: string;
  adminPassword = '';
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
      name: this.translate.instant('Download Encryption Key'),
      disabled: true,
      function: () => {
        this.ws.call('auth.check_user', ['root', this.adminPassword]).pipe(untilDestroyed(this)).subscribe((res) => {
          if (res) {
            this.encryptionService.openEncryptDialog(this.pk, this.routeReturn, this.poolName);
          } else {
            this.dialogService.info('Error', 'The administrator password is incorrect.', '340px');
          }
        });
      },
    },
    {
      id: 'custom_cancel',
      name: this.translate.instant('Cancel'),
      function: () => {
        this.router.navigate(new Array('/').concat(
          this.routeReturn,
        ));
      },
    }];

  resourceTransformIncomingRestData(data: Pool): Pool {
    this.poolName = data.name;
    const config: FormParagraphConfig = _.find(this.fieldConfig, { name: 'encrypt-headline' });
    config.paraText += ` <em>${this.poolName}</em>`;
    return data;
  }

  pk: string;
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
    protected translate: TranslateService,
  ) {}

  preInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    entityForm.formGroup.controls['adminpw'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      this.adminPassword = res;
      const btn = document.getElementById('cust_button_Download Encryption Key') as HTMLInputElement;
      btn.disabled = this.adminPassword === '';
    });
  }

  customSubmit(value: { name: string; adminpw: string; passphrase: string }): void {
    this.ws.call('auth.check_user', ['root', value.adminpw]).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.encryptionService.setPassphrase(this.pk, value.passphrase, value.adminpw,
          value.name, this.routeReturn, false, true, 'created for');
      } else {
        this.dialogService.info('Error', 'The administrator password is incorrect.', '340px');
      }
    });
  }
}
