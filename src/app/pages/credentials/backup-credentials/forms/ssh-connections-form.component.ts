import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import helptext from 'app/helptext/system/ssh-connections';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  KeychainCredentialService, WebSocketService, DialogService, ReplicationService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-ssh-connections-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [KeychainCredentialService, ReplicationService],
})
export class SshConnectionsFormComponent implements FormConfiguration {
  queryCall: 'keychaincredential.query' = 'keychaincredential.query';
  queryCallOption: any[];
  protected sshCalls = {
    manual: 'keychaincredential.create' as 'keychaincredential.create',
    semiautomatic: 'keychaincredential.remote_ssh_semiautomatic_setup' as 'keychaincredential.remote_ssh_semiautomatic_setup',
  };
  addCall: 'keychaincredential.create' | 'keychaincredential.remote_ssh_semiautomatic_setup' = this.sshCalls['manual'];
  editCall: 'keychaincredential.update' = 'keychaincredential.update';
  isEntity = true;
  keypairCount = 0;
  protected namesInUseConnection: string[] = [];
  protected namesInUse: string[] = [];
  title = helptext.formTitle;
  protected isOneColumnForm = true;
  private rowNum: any;
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
          type: 'input',
          name: 'name',
          placeholder: helptext.name_placeholder,
          tooltip: helptext.name_tooltip,
          required: true,
          validation: [Validators.required, forbiddenValues(this.namesInUseConnection)],
        }, {
          type: 'select',
          name: 'setup_method',
          placeholder: helptext.setup_method_placeholder,
          tooltip: helptext.setup_method_tooltip,
          options: [
            {
              label: 'Manual',
              value: 'manual',
            }, {
              label: 'Semi-automatic (TrueNAS only)',
              value: 'semiautomatic',
            },
          ],
          value: 'semiautomatic',
          isHidden: false,
        },
      ],
    },
    {
      name: helptext.fieldset_authentication,
      label: true,
      class: 'authentication',
      config: [
        {
          type: 'input',
          name: 'host',
          placeholder: helptext.host_placeholder,
          tooltip: helptext.host_tooltip,
          required: true,
          validation: [Validators.required],
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'setup_method',
              value: 'manual',
            }],
          }],
        }, {
          type: 'input',
          inputType: 'number',
          name: 'port',
          placeholder: helptext.port_placeholder,
          tooltip: helptext.port_tooltip,
          value: 22,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'setup_method',
              value: 'manual',
            }],
          }],
        }, {
          type: 'input',
          name: 'url',
          placeholder: helptext.url_placeholder,
          tooltip: helptext.url_tooltip,
          required: true,
          validation: [Validators.required],
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'setup_method',
              value: 'semiautomatic',
            }],
          }],
        }, {
          type: 'input',
          name: 'username',
          placeholder: helptext.username_placeholder,
          tooltip: helptext.username_tooltip,
          value: 'root',
          required: true,
          validation: [Validators.required],
        }, {
          type: 'input',
          inputType: 'password',
          name: 'password',
          placeholder: helptext.password_placeholder,
          tooltip: helptext.password_tooltip,
          togglePw: true,
          required: true,
          validation: [Validators.required],
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'setup_method',
              value: 'semiautomatic',
            }],
          }],
        }, {
          type: 'select',
          name: 'private_key',
          placeholder: helptext.private_key_placeholder,
          tooltip: helptext.private_key_tooltip,
          options: [],
          value: '',
          required: true,
          validation: [Validators.required],
        }, {
          type: 'textarea',
          name: 'remote_host_key',
          placeholder: helptext.remote_host_key_placeholder,
          tooltip: helptext.remote_host_key_tooltip,
          value: '',
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'setup_method',
              value: 'manual',
            }],
          }],
        }, {
          type: 'button',
          name: 'remote_host_key_button',
          customEventActionLabel: helptext.discover_remote_host_key_button,
          value: '',
          customEventMethod: () => {
            this.getRemoteHostKey();
          },
        },
      ],
    },
    {
      name: helptext.fieldset_advanced,
      label: true,
      class: 'advanced',
      config: [
        {
          type: 'select',
          name: 'cipher',
          placeholder: helptext.cipher_placeholder,
          tooltip: helptext.cipher_tooltip,
          options: [
            {
              label: 'Standard',
              value: 'STANDARD',
            }, {
              label: 'Fast',
              value: 'FAST',
            }, {
              label: 'Disabled',
              value: 'DISABLED',
            },
          ],
          value: 'STANDARD',
        }, {
          type: 'input',
          inputType: 'number',
          name: 'connect_timeout',
          placeholder: helptext.connect_timeout_placeholder,
          tooltip: helptext.connect_timeout_tooltip,
          value: 10,
        },
      ],
    },
  ];

  protected manualMethodFields = [
    'host',
    'port',
    'username',
    'private_key',
    'remote_host_key',
    'cipher',
    'connect_timeout',
  ];
  protected entityForm: EntityFormComponent;

  constructor(
    private aroute: ActivatedRoute,
    private keychainCredentialService: KeychainCredentialService,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private replicationService: ReplicationService, private modalService: ModalService,
  ) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId) => {
      this.rowNum = rowId;
      this.getRow.unsubscribe();
    });
  }

  async preInit(): Promise<void> {
    if (this.rowNum) {
      this.queryCallOption = [['id', '=', this.rowNum]];
      _.find(this.fieldSets[0].config, { name: 'setup_method' }).isHidden = true;
    } else {
      _.find(this.fieldSets[1].config, { name: 'private_key' }).options.push({
        label: 'Generate New',
        value: 'NEW',
      });
    }
    this.keychainCredentialService.getSSHConnections().toPromise().then((connections) => {
      const sshConnections = connections
        .filter((connection) => connection.id != this.rowNum)
        .map((connection) => connection.name);
      this.namesInUse.push(...sshConnections);
      this.namesInUseConnection.push(...sshConnections);
    });
    const privateKeyField = _.find(this.fieldSets[1].config, { name: 'private_key' });
    this.keychainCredentialService.getSSHKeys().toPromise().then((keyPairs) => {
      const namesInUse = keyPairs
        .filter((sshKey) => sshKey.name.endsWith(' Key'))
        .map((sshKey) => sshKey.name.substring(0, sshKey.name.length - 4));
      this.namesInUse.push(...namesInUse);
      for (const i in keyPairs) {
        privateKeyField.options.push({ label: keyPairs[i].name, value: keyPairs[i].id });
      }
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;
    this.updateDiscoverButtonDisabled();
    if (this.entityForm.isNew) {
      this.addCall = this.sshCalls[this.entityForm.formGroup.controls['setup_method'].value as keyof SshConnectionsFormComponent['sshCalls']];
      this.entityForm.formGroup.controls['setup_method'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: any) => {
        this.addCall = this.sshCalls[res as keyof SshConnectionsFormComponent['sshCalls']];
        this.updateDiscoverButtonDisabled();
      });
    } else {
      this.entityForm.formGroup.controls['setup_method'].setValue('manual');
    }

    const nameCtrl = this.entityForm.formGroup.controls['name'];
    let preValue = this.entityForm.formGroup.controls['private_key'].value;
    this.entityForm.formGroup.controls['private_key'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (res === 'NEW') {
        nameCtrl.setValidators([Validators.required, forbiddenValues(this.namesInUse)]);
        nameCtrl.updateValueAndValidity();
      } else if (preValue === 'NEW') {
        nameCtrl.setValidators([Validators.required, forbiddenValues(this.namesInUseConnection)]);
        nameCtrl.updateValueAndValidity();
      }
      preValue = res;
      this.updateDiscoverButtonDisabled();
    });

    this.entityForm.formGroup.controls['host'].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateDiscoverButtonDisabled();
    });

    this.entityForm.formGroup.controls['username'].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateDiscoverButtonDisabled();
    });
  }

  updateDiscoverButtonDisabled(): void {
    if (this.entityForm.formGroup.controls['setup_method'].value === 'manual') {
      this.setDisabled(this.fieldSets[1].config, 'remote_host_key_button', !this.isManualAuthFormValid(), false);
    } else {
      this.setDisabled(this.fieldSets[1].config, 'remote_host_key_button', true, true);
    }
  }

  isManualAuthFormValid(): boolean {
    return this.entityForm.formGroup.controls['host'].valid
      && this.entityForm.formGroup.controls['private_key'].valid
      && this.entityForm.formGroup.controls['username'].valid;
  }

  setDisabled(fieldConfig: any, fieldName: string, disable: boolean, hide = false): void {
    if (hide) {
      disable = hide;
    }

    const field = _.find(fieldConfig, { name: fieldName });

    field.disabled = disable;
    field['isHidden'] = hide;

    if (this.entityForm.formGroup.controls[fieldName]) {
      const method = disable ? 'disable' : 'enable';
      this.entityForm.formGroup.controls[fieldName][method]();
    }
  }

  getRemoteHostKey(): void {
    this.loader.open();
    const payload = {
      host: this.entityForm.value['host'],
      port: this.entityForm.value['port'],
      connect_timeout: this.entityForm.value['connect_timeout'],
    };

    this.ws.call('keychaincredential.remote_ssh_host_key_scan', [payload]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        this.loader.close();
        this.entityForm.formGroup.controls['remote_host_key'].setValue(res);
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, err, this.dialogService);
      },
    );
  }

  resourceTransformIncomingRestData(wsResponse: KeychainCredential): any {
    const transformed: any = { ...wsResponse };
    for (const item in wsResponse.attributes) {
      transformed[item] = wsResponse.attributes[item as keyof KeychainCredential['attributes']];
    }
    return transformed;
  }

  async customSubmit(data: any): Promise<any> {
    delete data.remote_host_key_button;
    this.loader.open();
    if (data['private_key'] == 'NEW') {
      await this.replicationService.genSSHKeypair().then(
        async (keyPair) => {
          const keyCount = this.keypairCount++ > 0 ? this.keypairCount : '';
          const payload = {
            name: data['name'] + ' Key' + keyCount,
            type: KeychainCredentialType.SshKeyPair,
            attributes: keyPair,
          };
          await this.ws.call('keychaincredential.create', [payload]).toPromise().then(
            (sshKey) => {
              data['private_key'] = sshKey.id;
            },
            (sshKey_err) => {
              this.loader.close();
              new EntityUtils().handleWSError(this, sshKey_err, this.dialogService);
            },
          );
        },
        (err) => {
          this.loader.close();
          new EntityUtils().handleWSError(this, err, this.dialogService);
        },
      );
    }

    if (data['setup_method'] === 'manual') {
      const attributes: any = {};
      for (const item in this.manualMethodFields) {
        attributes[this.manualMethodFields[item]] = data[this.manualMethodFields[item]];
        delete data[this.manualMethodFields[item]];
      }
      data['attributes'] = attributes;
      if (this.entityForm.isNew) {
        data['type'] = KeychainCredentialType.SshCredentials;
      }
    }
    delete data['setup_method'];

    this.entityForm.submitFunction(data).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.modalService.close('slide-in-form');
        this.modalService.refreshTable();
      },
      (err: any) => {
        this.loader.close();
        this.modalService.refreshTable();
        if (err.hasOwnProperty('reason') && (err.hasOwnProperty('trace'))) {
          new EntityUtils().handleWSError(this, err, this.dialogService);
        } else {
          new EntityUtils().handleError(this, err);
        }
      },
    );
  }
}
