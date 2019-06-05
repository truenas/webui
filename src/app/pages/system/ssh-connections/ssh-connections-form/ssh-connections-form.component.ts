import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/system/ssh-connections';
import { KeychainCredentialService, WebSocketService, DialogService, ReplicationService } from '../../../../services';
import * as _ from 'lodash';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
    selector: 'app-ssh-connections-form',
    template: `<entity-form [conf]="this"></entity-form>`,
    providers: [KeychainCredentialService, ReplicationService]
})
export class SshConnectionsFormComponent {

    protected queryCall = 'keychaincredential.query';
    protected queryCallOption = [["id", "="]];
    protected addCall = 'keychaincredential.create';
    protected semiautomaticAddCall = 'keychaincredential.remote_ssh_semiautomatic_setup';
    protected editCall = 'keychaincredential.update';
    protected route_success: string[] = ['system', 'sshconnections'];
    protected isEntity = true;

    protected fieldConfig: FieldConfig[] = [
        {
            type: 'input',
            name: 'name',
            placeholder: helptext.name_placeholder,
            tooltip: helptext.name_tooltip,
            required: true,
            validation: [Validators.required]
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
            value: 'manual',
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
            options: [
                {
                    label: 'Create New',
                    value: 'NEW'
                }
            ],
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
        const privateKeyField = _.find(this.fieldConfig, { name: 'private_key' });
        this.keychainCredentialService.getSSHKeys().subscribe(
            (res) => {
                for (const i in res) {
                    privateKeyField.options.push({ label: res[i].name, value: res[i].id });
                }
            }
        )
    }

    isCustActionVisible(actionId) {
        if (this.entityForm.formGroup.controls['setup_method'].value === 'manual') {
            return true;
        }
        return false;
    }

    preInit() {
        this.aroute.params.subscribe(params => {
            if (params['pk']) {
                this.queryCallOption[0].push(params['pk']);
                _.find(this.fieldConfig, { name: 'setup_method' }).isHidden = true;
            }
        });
    }

    afterInit(entityForm) {
        this.entityForm = entityForm;
        if (this.entityForm.isNew) {
            this.entityForm.formGroup.controls['setup_method'].valueChanges.subscribe((res) => {
                this.addCall = res === 'semiautomatic' ? this.semiautomaticAddCall : this.addCall;
            });
        }
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
                        name: data['name'] + '_keypair',
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
                    new EntityUtils().handleWSError(this, err);
                } else {
                    new EntityUtils().handleError(this, err);
                }
            });
    }
}