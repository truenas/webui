import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/system/ssh-connections';
import { KeychainCredentialService, WebSocketService, DialogService, ReplicationService } from '../../../../services';
import * as _ from 'lodash';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../common/entity/utils';
import { forbiddenValues } from '../../../common/entity/entity-form/validators/forbidden-values-validation';

@Component({
    selector: 'app-ssh-connections-form',
    template: `<entity-form [conf]="this"></entity-form>`,
    providers: [KeychainCredentialService, ReplicationService]
})
export class SshConnectionsFormComponent {

    protected queryCall = 'keychaincredential.query';
    protected queryCallOption = [["id", "="]];
    protected sshCalls = {
        manual: 'keychaincredential.create',
        semiautomatic: 'keychaincredential.remote_ssh_semiautomatic_setup',
    }
    protected addCall = this.sshCalls['manual'];
    protected editCall = 'keychaincredential.update';
    protected route_success: string[] = ['system', 'sshconnections'];
    protected isEntity = true;
    protected namesInUseConnection = [];
    protected namesInUse = [];

    protected fieldConfig: FieldConfig[] = [
        {
            type: 'input',
            name: 'name',
            placeholder: helptext.name_placeholder,
            tooltip: helptext.name_tooltip,
            required: true,
            validation: [Validators.required, forbiddenValues(this.namesInUseConnection)]
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
                    label: 'Semi-automatic (FreeNAS only)',
                    value: 'semiautomatic',
                }
            ],
            value: 'semiautomatic',
            isHidden: false,
        }, {
            type: 'input',
            name: 'host',
            placeholder: helptext.host_placeholder,
            tooltip: helptext.host_tooltip,
            required: true,
            validation: [Validators.required],
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'setup_method',
                    value: 'manual',
                }]
            }],
        }, {
            type: 'input',
            inputType: 'number',
            name: 'port',
            placeholder: helptext.port_placeholder,
            tooltip: helptext.port_tooltip,
            value: 22,
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'setup_method',
                    value: 'manual',
                }]
            }],
        }, {
            type: 'input',
            name: 'url',
            placeholder: helptext.url_placeholder,
            tooltip: helptext.url_tooltip,
            required: true,
            validation: [Validators.required],
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'setup_method',
                    value: 'semiautomatic',
                }]
            }],
        }, {
            type: 'input',
            name: 'username',
            placeholder: helptext.username_placeholder,
            tooltip: helptext.username_tooltip,
            value: 'root',
            required: true,
            validation: [Validators.required],
        },  {
            type: 'input',
            inputType: 'password',
            name: 'password',
            placeholder: helptext.password_placeholder,
            tooltip: helptext.password_tooltip,
            togglePw: true,
            required: true,
            validation: [Validators.required],
            relation: [{
                action: 'SHOW',
                when: [{
                    name: 'setup_method',
                    value: 'semiautomatic',
                }]
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
                action: 'SHOW',
                when: [{
                    name: 'setup_method',
                    value: 'manual',
                }]
            }],
        }, {
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
                }
            ],
            value: 'STANDARD',
        }, {
            type: 'input',
            inputType: 'number',
            name: 'connect_timeout',
            placeholder: helptext.connect_timeout_placeholder,
            tooltip: helptext.connect_timeout_tooltip,
            value: 10,
        }
    ]

    protected custActions = [
        {
            id: 'discover_remote_host_key',
            name: helptext.discover_remote_host_key_button,
            function: () => {
                this.loader.open();
                const payload = {
                    'host': this.entityForm.value['host'],
                    'port': this.entityForm.value['port'],
                    'connect_timeout': this.entityForm.value['connect_timeout'],
                };

                this.ws.call('keychaincredential.remote_ssh_host_key_scan', [payload]).subscribe(
                    (res) => {
                        this.loader.close();
                        this.entityForm.formGroup.controls['remote_host_key'].setValue(res);
                    },
                    (err) => {
                        this.loader.close();
                        new EntityUtils().handleWSError(this, err, this.dialogService);
                    }
                )
            }
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
    protected entityForm: any;

    constructor(
        private aroute: ActivatedRoute,
        private keychainCredentialService: KeychainCredentialService,
        private ws: WebSocketService,
        private loader: AppLoaderService,
        private dialogService: DialogService,
        private replicationService: ReplicationService) {

    }

    isCustActionVisible(actionId) {
        if (this.entityForm.formGroup.controls['setup_method'].value === 'manual') {
            return true;
        }
        return false;
    }

    async preInit() {
        let pk;
        await this.aroute.params.subscribe(params => {
            if (params['pk']) {
                pk = params['pk'];
                this.queryCallOption[0].push(params['pk']);
                _.find(this.fieldConfig, { name: 'setup_method' }).isHidden = true;
            } else {
                _.find(this.fieldConfig, { name: 'private_key'}).options.push({
                    label: 'Generate New',
                    value: 'NEW'
                });
            }
        });
        this.keychainCredentialService.getSSHConnections().toPromise().then(
            (res) => {
                const sshConnections = res.filter(item => item.id != pk).map(sshConnection => sshConnection.name);
                this.namesInUse.push(...sshConnections);
                this.namesInUseConnection.push(...sshConnections);
            }
        )
        const privateKeyField = _.find(this.fieldConfig, { name: 'private_key' });
        this.keychainCredentialService.getSSHKeys().toPromise().then(
            (res) => {
                this.namesInUse.push(...res.filter(sshKey => sshKey.name.endsWith(' Key')).map(sshKey =>
                    sshKey.name.substring(0, sshKey.name.length - 4)));
                for (const i in res) {
                    privateKeyField.options.push({ label: res[i].name, value: res[i].id });
                }
            }
        )
    }

    afterInit(entityForm) {
        this.entityForm = entityForm;
        if (this.entityForm.isNew) {
            this.addCall = this.sshCalls[this.entityForm.formGroup.controls['setup_method'].value];
            this.entityForm.formGroup.controls['setup_method'].valueChanges.subscribe((res) => {
                this.addCall = this.sshCalls[res];
            });
        } else {
            this.entityForm.formGroup.controls['setup_method'].setValue('manual');
        }

        const nameCtrl = this.entityForm.formGroup.controls['name'];
        let preValue =  this.entityForm.formGroup.controls['private_key'].value;
        this.entityForm.formGroup.controls['private_key'].valueChanges.subscribe((res) => {
            if (res === 'NEW') {
                nameCtrl.setValidators([Validators.required, forbiddenValues(this.namesInUse)]);
                nameCtrl.updateValueAndValidity();
            } else if (preValue === 'NEW') {
                nameCtrl.setValidators([Validators.required, forbiddenValues(this.namesInUseConnection)]);
                nameCtrl.updateValueAndValidity();
            }
            preValue = res;
        });
    }

    resourceTransformIncomingRestData(wsResponse) {
        for (const item in wsResponse.attributes) {
            wsResponse[item] = wsResponse.attributes[item];
        }
        return wsResponse;
    }

    async customSubmit(data) {
        this.loader.open();
        if (data['private_key'] == 'NEW') {
            await this.replicationService.genSSHKeypair().then(
                async (res) => {
                    const payload = {
                        name: data['name'] + ' Key',
                        type: 'SSH_KEY_PAIR',
                        attributes: res,
                    };
                    await this.ws.call('keychaincredential.create', [payload]).toPromise().then(
                        (sshKey) => {
                            data['private_key'] = sshKey.id;
                        },
                        (sshKey_err) => {
                            this.loader.close();
                            new EntityUtils().handleWSError(this, sshKey_err, this.dialogService);
                        });
                },
                (err) => {
                    this.loader.close();
                    new EntityUtils().handleWSError(this, err, this.dialogService);
                }
            )
        }

        if (data['setup_method'] === 'manual') {
            const attributes = {};
            for (const item in this.manualMethodFields) {
                attributes[this.manualMethodFields[item]] = data[this.manualMethodFields[item]];
                delete data[this.manualMethodFields[item]];
            }
            data['attributes'] = attributes;
            if (this.entityForm.isNew) {
                data['type'] = 'SSH_CREDENTIALS';
            }
        }
        delete data['setup_method'];

        this.entityForm.submitFunction(data).subscribe(
            (res) => {
                this.loader.close();
                this.entityForm.router.navigate(new Array('/').concat(this.route_success));
            },
            (err) => {
                this.loader.close();
                if (err.hasOwnProperty("reason") && (err.hasOwnProperty("trace"))) {
                    new EntityUtils().handleWSError(this, err, this.dialogService);
                } else {
                    new EntityUtils().handleError(this, err);
                }
            });
    }
}
