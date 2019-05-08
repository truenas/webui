import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';

import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import helptext from '../../../../helptext/task-calendar/replication/replication-wizard';
import replicationHelptext from '../../../../helptext/task-calendar/replication/replication';
import sshConnectionsHelptex from '../../../../helptext/system/ssh-connections';

import { DialogService, KeychainCredentialService, WebSocketService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

@Component({
    selector: 'app-replication-wizard',
    template: `<entity-wizard [conf]="this"></entity-wizard>`,
    providers: [KeychainCredentialService]
})
export class ReplicationWizardComponent {

    public route_success: string[] = ['task', 'replication'];
    public isLinear = true;
    public summary_title = "Replication Summary";

    protected custActions: Array<any> = [
        {
            id: 'discover_remote_host_key',
            name: sshConnectionsHelptex.discover_remote_host_key_button,
            function: () => {
                this.loader.open();
                const payload = {
                    'host': this.entityWizard.value['host'],
                    'port': this.entityWizard.value['port'],
                    'connect_timeout': this.entityWizard.value['connect_timeout'],
                };

                this.ws.call('keychaincredential.remote_ssh_host_key_scan', [payload]).subscribe(
                    (res) => {
                        this.loader.close();
                        this.entityWizard.formGroup.controls['remote_host_key'].setValue(res);
                    },
                    (err) => {
                        this.loader.close();
                        new EntityUtils().handleWSError(this, err, this.dialogService);
                    }
                )
            }
        },
        {
            id: 'advanced_add',
            name: "Advanced Replication Creation",
            function: () => {
                this.router.navigate(
                    new Array('').concat(["tasks", "replication", "add"])
                );
            }
        }
    ];

    protected wizardConfig: Wizard[] = [
        {
            label: helptext.step1_label,
            fieldConfig: [
                {
                    type: 'select',
                    name: 'transport',
                    placeholder: replicationHelptext.transport_placeholder,
                    tooltip: replicationHelptext.transport_tooltip,
                    options: [
                        {
                            label: 'SSH',
                            value: 'SSH',
                        }, {
                            label: 'SSH+NETCAT',
                            value: 'SSH+NETCAT',
                        }
                    ],
                    value: 'SSH',
                    required: true,
                },
                // ssh
                {
                    type: 'select',
                    name: 'ssh_credentials',
                    placeholder: replicationHelptext.ssh_credentials_placeholder,
                    tooltip: replicationHelptext.ssh_credentials_tooltip,
                    options: [
                        {
                            label: 'Create New',
                            value: 'NEW'
                        }
                    ],
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'input',
                    name: 'name',
                    placeholder: sshConnectionsHelptex.name_placeholder,
                    tooltip: sshConnectionsHelptex.name_tooltip,
                    required: true,
                    validation: [Validators.required]
                },
                {
                    type: 'select',
                    name: 'setup_method',
                    placeholder: sshConnectionsHelptex.setup_method_placeholder,
                    tooltip: sshConnectionsHelptex.setup_method_tooltip,
                    options: [
                        {
                            label: 'Manual',
                            value: 'manual',
                        }, {
                            label: 'Semi-automatic (FreeNAS only)',
                            value: 'semiautomatic',
                        }
                    ],
                    isHidden: false,
                },
                {
                    type: 'input',
                    name: 'host',
                    placeholder: sshConnectionsHelptex.host_placeholder,
                    tooltip: sshConnectionsHelptex.host_tooltip,
                    required: true,
                    validation: [Validators.required],
                }, {
                    type: 'input',
                    inputType: 'number',
                    name: 'port',
                    placeholder: sshConnectionsHelptex.port_placeholder,
                    tooltip: sshConnectionsHelptex.port_tooltip,
                    value: 22,
                }, {
                    type: 'input',
                    name: 'url',
                    placeholder: sshConnectionsHelptex.url_placeholder,
                    tooltip: sshConnectionsHelptex.url_tooltip,
                    required: true,
                    validation: [Validators.required],
                }, {
                    type: 'input',
                    name: 'username',
                    placeholder: sshConnectionsHelptex.username_placeholder,
                    tooltip: sshConnectionsHelptex.username_tooltip,
                    value: 'root',
                    required: true,
                    validation: [Validators.required],
                }, {
                    type: 'input',
                    inputType: 'password',
                    name: 'password',
                    placeholder: 'Password', //sshConnectionsHelptex.password_placeholder,
                    // tooltip: sshConnectionsHelptex.password_tooltip,
                    togglePw: true,
                    required: true,
                    validation: [Validators.required],
                }, {
                    type: 'select',
                    name: 'private_key',
                    placeholder: sshConnectionsHelptex.private_key_placeholder,
                    tooltip: sshConnectionsHelptex.private_key_tooltip,
                    options: [
                        {
                            label: '---------',
                            value: '',
                        }
                    ],
                    value: '',
                    required: true,
                    validation: [Validators.required],
                }, {
                    type: 'textarea',
                    name: 'remote_host_key',
                    placeholder: sshConnectionsHelptex.remote_host_key_placeholder,
                    tooltip: sshConnectionsHelptex.remote_host_key_tooltip,
                    value: '',
                }, {
                    type: 'select',
                    name: 'cipher',
                    placeholder: sshConnectionsHelptex.cipher_placeholder,
                    tooltip: sshConnectionsHelptex.cipher_tooltip,
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
                }
            ]
        }
    ];

    protected transportSSHFieldGroup: any[] = [
        'ssh_credentials',
    ];
    protected transportSSHnetcatFieldGroup: any[] = [
    ];

    protected sshFieldGroup: any[] = [
        'name',
        'setup_method',
        'cipher',
    ];
    protected semiSSHFieldGroup: any[] = [
        'url',
        'username',
        'password',
    ];
    protected manualSSHFieldGroup: any[] = [
        'host',
        'port',
        'username',
        'private_key',
        'remote_host_key'
    ];


    protected entityWizard: any;
    protected hiddenFieldGroup: any[] = [

    ];
    public summaryObj = {
        // 'name': null,
        // 'type': null,
        // 'path': null,
        // 'filesize': null,
        // 'disk': null,
        // 'dataset': null,
        // 'volsize': null,
        // 'volsize_unit': null,
        // 'usefor': null,
        // 'portal': null,
        // 'discovery_authmethod': null,
        // 'discovery_authgroup': null,
        // 'ip': null,
        // 'port': null,
        // 'auth': null,
        // 'tag': null,
        // 'user': null,
        // 'initiators': null,
        // 'auth_network': null,
        // 'comment': null,
    };
    protected createManualSSHConnection = false;

    constructor(private router: Router, private keychainCredentialService: KeychainCredentialService,
        private loader: AppLoaderService, private dialogService: DialogService,
        private ws: WebSocketService) { }

    isCustActionVisible(id, stepperIndex) {
        if (id == 'advanced_add' && stepperIndex == 0) {
            return true;
        }
        if (id == 'discover_remote_host_key' && stepperIndex == 0 && this.createManualSSHConnection) {
            return true;
        }

        return false;
    }

    afterInit(entityWizard) {
        this.entityWizard = entityWizard;

        this.summaryInit();
        this.step0Init();
    }

    summaryInit() {
    }

    step0Init() {
        const ssh_credentialsField = _.find(this.wizardConfig[0].fieldConfig, { 'name': 'ssh_credentials' });
        this.keychainCredentialService.getSSHConnections().subscribe((res) => {
            for (const i in res) {
                ssh_credentialsField.options.push({ label: res[i].name, value: res[i].id });
            }
        })

        const privateKeyField = _.find(this.wizardConfig[0].fieldConfig, { name: 'private_key' });
        this.keychainCredentialService.getSSHKeys().subscribe(
            (res) => {
                for (const i in res) {
                    privateKeyField.options.push({ label: res[i].name, value: res[i].id });
                }
            }
        )

        this.entityWizard.formArray.controls[0].controls['transport'].valueChanges.subscribe((value) => {
            const ssh = value == 'SSH' ? true : false;
            this.disablefieldGroup(this.transportSSHFieldGroup, !ssh, 0);
            this.disablefieldGroup(this.transportSSHnetcatFieldGroup, ssh, 0);
        });
        this.entityWizard.formArray.controls[0].controls['ssh_credentials'].valueChanges.subscribe((value) => {
            const newSSH = value == 'NEW' ? true : false;
            this.disablefieldGroup([...this.sshFieldGroup, ...this.semiSSHFieldGroup, ...this.manualSSHFieldGroup], !newSSH, 0);
            if (newSSH) {
                this.entityWizard.formArray.controls[0].controls['setup_method'].setValue(this.entityWizard.formArray.controls[0].controls['setup_method'].value);
            }

            this.createManualSSHConnection = newSSH ? this.createManualSSHConnection : false;
        });
        this.entityWizard.formArray.controls[0].controls['setup_method'].valueChanges.subscribe((value) => {
            const manual = value == 'manual' ? true : false;
            this.disablefieldGroup(this.semiSSHFieldGroup, manual, 0);
            this.disablefieldGroup(this.manualSSHFieldGroup, !manual, 0);

            this.createManualSSHConnection = manual;
        });

        this.entityWizard.formArray.controls[0].controls['setup_method'].setValue('semiautomatic');
        this.entityWizard.formArray.controls[0].controls['ssh_credentials'].setValue('');
        this.entityWizard.formArray.controls[0].controls['transport'].setValue('SSH');
    }

    disablefieldGroup(fieldGroup: any, disabled: boolean, stepIndex: number) {
        fieldGroup.forEach(field => {
            if (_.indexOf(this.hiddenFieldGroup, field) < 0) {
                const control: any = _.find(this.wizardConfig[stepIndex].fieldConfig, { 'name': field });
                control['isHidden'] = disabled;
                control.disabled = disabled;
                disabled ? this.entityWizard.formArray.controls[stepIndex].controls[field].disable() : this.entityWizard.formArray.controls[stepIndex].controls[field].enable();
                if (disabled) {
                    this.summaryObj[field] = null;
                }
            }
        });
    }
}