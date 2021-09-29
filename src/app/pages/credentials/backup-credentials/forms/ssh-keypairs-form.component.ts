import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import helptext from 'app/helptext/system/ssh-keypairs';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { atLeastOne } from 'app/pages/common/entity/entity-form/validators/at-least-one-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, DialogService, StorageService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-ssh-keypairs-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class SshKeypairsFormComponent implements FormConfiguration {
  queryCall: 'keychaincredential.query' = 'keychaincredential.query';
  queryCallOption: [QueryFilter<KeychainCredential>];
  addCall: 'keychaincredential.create' = 'keychaincredential.create';
  editCall: 'keychaincredential.update' = 'keychaincredential.update';
  isEntity = true;
  protected entityForm: EntityFormComponent;
  protected isOneColumnForm = true;
  private rowNum: number;
  title = helptext.formTitle;
  private getRow = new Subscription();

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_basic,
      label: true,
      class: 'basic',
      width: '100%',
      config: [
        {
          type: 'paragraph',
          name: 'key_instructions',
          paraText: helptext.key_instructions,
        }, {
          type: 'input',
          name: 'name',
          placeholder: helptext.name_placeholder,
          tooltip: helptext.name_tooltip,
          required: true,
          validation: [Validators.required],
        },
      ],
    },
    {
      name: helptext.fieldset_basic,
      label: false,
      class: 'basic',
      width: '100%',
      config: [
        {
          type: 'button',
          name: 'remote_host_key_button',
          customEventActionLabel: helptext.generate_key_button,
          value: '',
          customEventMethod: () => {
            this.generateKeypair();
          },
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'setup_method',
              value: 'manual',
            }],
          }],
        }, {
          type: 'textarea',
          name: 'private_key',
          placeholder: helptext.private_key_placeholder,
          tooltip: helptext.private_key_tooltip,
        }, {
          type: 'textarea',
          name: 'public_key',
          placeholder: helptext.public_key_placeholder,
          tooltip: helptext.public_key_tooltip,
          validation: [atLeastOne('private_key', [helptext.private_key_placeholder, helptext.public_key_placeholder])],
        },
      ],
    },
  ];

  compactCustomActions = [
    {
      id: 'download_private',
      name: helptext.download_private,
      function: () => {
        this.downloadKey('private_key');
      },
    },
    {
      id: 'download_public',
      name: helptext.download_public,
      function: () => {
        this.downloadKey('public_key');
      },
    },
  ];

  constructor(private aroute: ActivatedRoute, private ws: WebSocketService, private loader: AppLoaderService,
    private dialogService: DialogService, private storage: StorageService, private modalService: ModalService) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId: number) => {
      this.rowNum = rowId;
      this.getRow.unsubscribe();
    });
  }

  isCustActionDisabled(actionId: string): boolean {
    if (this.entityForm.formGroup.controls['name'].value) {
      if (actionId === 'download_private') {
        return !this.entityForm.formGroup.controls['private_key'].value;
      } if (actionId === 'download_public') {
        return !this.entityForm.formGroup.controls['public_key'].value;
      }
    }
    return true;
  }

  preInit(): void {
    if (this.rowNum) {
      this.queryCallOption = [['id', '=', this.rowNum]];
      this.rowNum = null;
    }
  }

  generateKeypair(): void {
    this.loader.open();
    this.clearPreviousErrors();
    const elements = document.getElementsByTagName('mat-error');
    while (elements[0]) elements[0].parentNode.removeChild(elements[0]);
    this.ws.call('keychaincredential.generate_ssh_key_pair').pipe(untilDestroyed(this)).subscribe((keyPair) => {
      this.loader.close();
      this.entityForm.formGroup.controls['private_key'].setValue(keyPair.private_key);
      this.entityForm.formGroup.controls['public_key'].setValue(keyPair.public_key);
    },
    (err) => {
      this.loader.close();
      new EntityUtils().handleWSError(this, err, this.dialogService);
    });
  }

  downloadKey(key_type: 'private_key' | 'public_key'): void {
    const name = this.entityForm.formGroup.controls['name'].value;
    const key = this.entityForm.formGroup.controls[key_type].value;
    const filename = name + '_' + key_type + '_rsa';
    const blob = new Blob([key], { type: 'text/plain' });
    this.storage.downloadBlob(blob, filename);
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;
    this.entityForm.formGroup.controls['private_key'].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.clearPreviousErrors();
    });
    this.entityForm.formGroup.controls['public_key'].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.clearPreviousErrors();
    });
  }

  clearPreviousErrors(): void {
    // Clears error messages from MW from previous attempts to Save
    const elements = document.getElementsByTagName('mat-error');
    while (elements[0]) elements[0].parentNode.removeChild(elements[0]);
  }

  resourceTransformIncomingRestData(wsResponse: KeychainCredential): any {
    const transformed: any = { ...wsResponse };
    for (const item in wsResponse.attributes) {
      transformed[item] = wsResponse.attributes[item as keyof KeychainCredential['attributes']];
    }
    return transformed;
  }

  beforeSubmit(data: any): any {
    if (data.remote_host_key_button || data.remote_host_key_button === '') {
      delete data.remote_host_key_button;
    }
    delete data['key_instructions'];
    if (this.entityForm.isNew) {
      data['type'] = KeychainCredentialType.SshKeyPair;
    }

    data['attributes'] = {
      private_key: data['private_key'],
      public_key: data['public_key'],
    };

    delete data['private_key'];
    delete data['public_key'];
    return data;
  }

  afterSubmit(): void {
    this.modalService.refreshTable();
  }
}
