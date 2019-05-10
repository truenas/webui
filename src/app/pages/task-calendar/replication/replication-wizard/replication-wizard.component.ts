import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Validators, FormControl } from '@angular/forms';
import * as _ from 'lodash';

import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import helptext from '../../../../helptext/task-calendar/replication/replication-wizard';
import replicationHelptext from '../../../../helptext/task-calendar/replication/replication';
import sshConnectionsHelptex from '../../../../helptext/system/ssh-connections';
import snapshotHelptext from '../../../../helptext/task-calendar/snapshot/snapshot-form';

import { DialogService, KeychainCredentialService, WebSocketService, ReplicationService, TaskService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { throwError } from 'rxjs';

@Component({
    selector: 'app-replication-wizard',
    template: `<entity-wizard [conf]="this"></entity-wizard>`,
    providers: [KeychainCredentialService, ReplicationService, TaskService]
})
export class ReplicationWizardComponent {

    public route_success: string[] = ['tasks', 'replication'];
    public isLinear = true;
    public summary_title = "Replication Summary";

    protected custActions: Array<any> = [
        {
            id: 'discover_remote_host_key',
            name: sshConnectionsHelptex.discover_remote_host_key_button,
            function: () => {
                this.loader.open();
                const payload = {
                    'host': this.entityWizard.formArray.controls[0].value['host'],
                    'port': this.entityWizard.formArray.controls[0].value['port'],
                };

                this.ws.call('keychaincredential.remote_ssh_host_key_scan', [payload]).subscribe(
                    (res) => {
                        this.loader.close();
                        this.entityWizard.formArray.controls[0].controls['remote_host_key'].setValue(res);
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
                    type: 'input',
                    name: 'name', //for new ssh connection and new snapshot task and replication
                    placeholder: helptext.name_placeholder,
                    tooltip: helptext.name_tooltip,
                    required: true,
                    validation: [Validators.required]
                },
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
                    required: true,
                },
                //netcat
                {
                    type: 'input',
                    name: 'netcat_active_side',
                    value: 'REMOTE',
                    isHidden: true,
                }, {
                    type: 'input',
                    name: 'netcat_active_side_listen_address',
                    value: '', // defaut to hostname
                    isHidden: true,
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
                    type: 'input',
                    name: 'remote_host_key',
                    isHidden: true,
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
        },
        {
            label: helptext.step2_label,
            fieldConfig: [
                {
                    type: 'select',
                    // multiple: true,
                    name: 'periodic_snapshot_tasks',
                    placeholder: replicationHelptext.periodic_snapshot_tasks_placeholder,
                    tooltip: replicationHelptext.periodic_snapshot_tasks_tooltip,
                    options: [
                        {
                            label: 'Create New',
                            value: 'NEW'
                        }
                    ],
                    required: true,
                    validation: [Validators.required],
                },
                // snapshot task
                {
                    type: 'select',
                    name: 'dataset',
                    placeholder: snapshotHelptext.dataset_placeholder,
                    tooltip: snapshotHelptext.dataset_tooltip,
                    options: [],
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'checkbox',
                    name: 'snapshot_recursive',
                    placeholder: snapshotHelptext.recursive_placeholder,
                    tooltip: snapshotHelptext.recursive_tooltip,
                    value: false,
                },
                {
                    placeholder: snapshotHelptext.lifetime_value_placeholder,
                    type: 'input',
                    name: 'lifetime_value',
                    inputType: 'number',
                    class: 'inline',
                    value: 2,
                    validation: [Validators.min(0)]
                },
                {
                    type: 'select',
                    name: 'lifetime_unit',
                    tooltip: snapshotHelptext.lifetime_unit_tooltip,
                    options: [{
                        label: 'Hours',
                        value: 'HOUR',
                    }, {
                        label: 'Days',
                        value: 'DAY',
                    }, {
                        label: 'Weeks',
                        value: 'WEEK',
                    }, {
                        label: 'Months',
                        value: 'MONTH',
                    }, {
                        label: 'Years',
                        value: 'YEAR',
                    }],
                    value: 'WEEK',
                    class: 'inline',
                },
                //   {
                //     type: 'input',
                //     name: 'naming_schema',
                //     placeholder: helptext.naming_schema_placeholder,
                //     tooltip: helptext.naming_schema_tooltip,
                //     value: 'auto-%Y-%m-%d_%H-%M',
                //   },
                {
                    type: 'scheduler',
                    name: 'snapshot_picker',
                    placeholder: snapshotHelptext.snapshot_picker_placeholder,
                    tooltip: snapshotHelptext.snapshot_picker_tooltip,
                    validation: [Validators.required],
                    required: true,
                    value: "0 0 * * *"
                },
                {
                    type: 'select',
                    name: 'begin',
                    placeholder: snapshotHelptext.begin_placeholder,
                    tooltip: snapshotHelptext.begin_tooltip,
                    options: [],
                    value: '09:00',
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'select',
                    name: 'end',
                    placeholder: snapshotHelptext.end_placeholder,
                    tooltip: snapshotHelptext.end_tooltip,
                    options: [],
                    value: '18:00',
                    required: true,
                    validation: [Validators.required],
                },
                //   {
                //     type: 'checkbox',
                //     name: 'enabled',
                //     placeholder: helptext.enabled_placeholder,
                //     tooltip: helptext.enabled_tooltip,
                //     value: true,
                //   }
                // replication task
                {
                    type: 'select',
                    name: 'direction',
                    placeholder: replicationHelptext.direction_placeholder,
                    tooltip: replicationHelptext.direction_tooltip,
                    options: [
                        {
                            label: 'PUSH',
                            value: 'PUSH',
                        }, {
                            label: 'PULL',
                            value: 'PULL',
                        }
                    ],
                },
                {
                    type: 'explorer',
                    initial: '/mnt',
                    explorerType: 'directory',
                    multiple: true,
                    name: 'source_datasets',
                    placeholder: replicationHelptext.source_datasets_placeholder,
                    tooltip: replicationHelptext.source_datasets_tooltip,
                    options: [],
                    required: true,
                    validation: [Validators.required],
                }, {
                    type: 'input',
                    name: 'target_dataset',
                    placeholder: replicationHelptext.target_dataset_placeholder,
                    tooltip: replicationHelptext.target_dataset_tooltip,
                    required: true,
                    validation: [Validators.required],
                }, {
                    type: 'checkbox',
                    name: 'recursive',
                    placeholder: replicationHelptext.recursive_placeholder,
                    tooltip: replicationHelptext.recursive_tooltip,
                }, {
                    type: 'input',
                    name: 'exclude',
                    placeholder: replicationHelptext.exclude_placeholder,
                    tooltip: replicationHelptext.exclude_tooltip,
                },
                {
                    type: 'checkbox',
                    name: 'auto',
                    placeholder: replicationHelptext.auto_placeholder,
                    tooltip: replicationHelptext.auto_tooltip,
                },
                {
                    type: 'select',
                    name: 'retention_policy',
                    placeholder: replicationHelptext.retention_policy_placeholder,
                    tooltip: replicationHelptext.retention_policy_tooltip,
                    options: [
                        {
                            label: 'Same as Source',
                            value: 'SOURCE',
                        }, {
                            label: 'Custom',
                            value: 'CUSTOM',
                        }, {
                            label: 'None',
                            value: 'NONE',
                        }
                    ],
                },
                {
                    type: 'checkbox',
                    name: 'enabled',
                    placeholder: replicationHelptext.enabled_placeholder,
                    tooltip: replicationHelptext.enabled_tooltip,
                    value: true,
                    isHidden: true,
                },
            ]
        }
    ];

    protected transportSSHFieldGroup: any[] = [
        'ssh_credentials',
    ];
    protected transportSSHnetcatFieldGroup: any[] = [
        'netcat_active_side',
        'netcat_active_side_listen_address',
        // 'netcat_active_side_port_min',
        // 'netcat_active_side_port_max',
    ];

    protected sshFieldGroup: any[] = [
        'setup_method',
        'private_key',
        'cipher',
        'username',
    ];
    protected semiSSHFieldGroup: any[] = [
        'url',
        'password',
    ];
    protected manualSSHFieldGroup: any[] = [
        'host',
        'port',
        'remote_host_key'
    ];

    protected snapshotFieldGroup: any[] = [
        'dataset',
        'snapshot_recursive',
        'lifetime_value',
        'lifetime_unit',
        'snapshot_picker',
        'begin',
        'end',
    ];
    protected replicationFieldGroup: any[] = [
        'direction',
        'source_datasets',
        'target_dataset',
        'recursive',
        'exclude',
        'auto',
        'retention_policy',
        'enabled',
    ];

    protected entityWizard: any;
    protected hiddenFieldGroup: any[] = [
        'netcat_active_side',
        'netcat_active_side_listen_address',
        'enabled',
        'remote_host_key',
    ];

    public summary: any;
    public summaryObj = {
        'name': null,
        'transport': null,
        'ssh_credentials': null,
        'setup_method': null,
        'cipher': null,
        'username': null,
        'url': null,
        'host': null,
        'port': null,
        'private_key': null,
        'periodic_snapshot_tasks': null,
        'dataset': null,
        'snapshot_recursive': null,
        'lifetime_value': null,
        'lifetime_unit': null,
        'snapshot_picker': null,
        'begin': null,
        'end': null,
        'direction': null,
        'source_datasets': null,
        'target_dataset': null,
        'recursive': null,
        'exclude': null,
        'auto': null,
        'retention_policy': null,
        'enabled': null,
    };
    protected createManualSSHConnection = false;

    protected createCalls = {
        ssh_credentials_semiautomatic: 'keychaincredential.remote_ssh_semiautomatic_setup',
        ssh_credentials_manual:'keychaincredential.create',
        periodic_snapshot_tasks: 'pool.snapshottask.create',
        replication: 'replication.create',
    }

    protected deleteCalls = {
        ssh_credentials_semiautomatic: 'keychaincredential.delete',
        ssh_credentials_manual: 'keychaincredential.delete',
        periodic_snapshot_tasks: 'pool.snapshottask.delete',
        replication: 'replication.delete',
    }

    constructor(private router: Router, private keychainCredentialService: KeychainCredentialService,
        private loader: AppLoaderService, private dialogService: DialogService,
        private ws: WebSocketService, private replicationService: ReplicationService,
        private taskService: TaskService) { }

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
        this.step1Init();
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
            const newSSH = (value == 'NEW' && this.entityWizard.formArray.controls[0].controls['transport'].value == 'SSH') ? true : false;
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

    step1Init() {
        const periodicSnapshotTasksField = _.find(this.wizardConfig[1].fieldConfig, { name: 'periodic_snapshot_tasks' });
        this.replicationService.getSnapshotTasks().subscribe(
            (res) => {
                for (const i in res) {
                    const label = res[i].dataset + ' - ' + res[i].naming_schema + ' - ' + res[i].lifetime_value + ' ' + res[i].lifetime_unit + '(S) - ' + (res[i].enabled ? 'Enabled' : 'Disabled');
                    periodicSnapshotTasksField.options.push({ label: label, value: res[i].id });
                }
            }
        )

        const datasetField = _.find(this.wizardConfig[1].fieldConfig, { 'name': 'dataset' });
        this.taskService.getVolumeList().subscribe((res) => {
            for (let i = 0; i < res.data.length; i++) {
                const volume_list = new EntityUtils().flattenData(res.data[i].children);
                for (const j in volume_list) {
                    datasetField.options.push({ label: volume_list[j].path, value: volume_list[j].path });
                }
            }
            datasetField.options = _.sortBy(datasetField.options, [function (o) { return o.label; }]);
        });

        const begin_field = _.find(this.wizardConfig[1].fieldConfig, { name: 'begin' });
        const end_field = _.find(this.wizardConfig[1].fieldConfig, { name: 'end' });
        const time_options = this.taskService.getTimeOptions();
        for (let i = 0; i < time_options.length; i++) {
            begin_field.options.push({ label: time_options[i].label, value: time_options[i].value });
            end_field.options.push({ label: time_options[i].label, value: time_options[i].value });
        }

        this.entityWizard.formArray.controls[1].controls['periodic_snapshot_tasks'].valueChanges.subscribe((value) => {
            const newSnapshot = value == 'NEW' ? true : false;
            this.disablefieldGroup(this.snapshotFieldGroup, !newSnapshot, 1);
        });

        this.entityWizard.formArray.controls[1].controls['recursive'].valueChanges.subscribe((value) => {
            this.disablefieldGroup(['exclude'], !value, 1);
        });

        this.entityWizard.formArray.controls[1].controls['direction'].setValue('PUSH');
        this.entityWizard.formArray.controls[1].controls['periodic_snapshot_tasks'].setValue('');
        this.entityWizard.formArray.controls[1].controls['recursive'].setValue(true);
        this.entityWizard.formArray.controls[1].controls['auto'].setValue(true);
        this.entityWizard.formArray.controls[1].controls['retention_policy'].setValue('NONE');
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

    summaryInit() {
        for (let step = 0; step < 2; step++) {
            Object.entries(this.entityWizard.formArray.controls[step].controls).forEach(([name, control]) => {
                if (name in this.summaryObj) {
                    (<FormControl>control).valueChanges.subscribe(((value) => {
                        if (value == undefined) {
                            this.summaryObj[name] = null;
                        } else {
                            this.summaryObj[name] = value;
                            // get label value
                            if (name == 'ssh_credentials' || name == 'private_key' || name == 'periodic_snapshot_tasks') {
                                const field = _.find(this.wizardConfig[step].fieldConfig, { name: name });
                                if (field) {
                                    this.summaryObj[name] = _.find(field.options, { value: value }) ? _.find(field.options, { value: value }).label : null;
                                }
                            }
                        }
                        this.summary = this.getSummary();
                    }));
                }
            });
        }
    }

    getSummary() {
        const summary = {
            'Name': this.summaryObj.name,
            'Direction': this.summaryObj.direction,
            'Transport': this.summaryObj.transport,
            'SSH Connection': this.summaryObj.ssh_credentials,
            'New SSH Connection': {
                'Setup Methodh': this.summaryObj.setup_method,
                'Host': this.summaryObj.host,
                'Port': this.summaryObj.port,
                'Username': this.summaryObj.name,
                'Private Key': this.summaryObj.private_key,
                'FreeNAS/TrueNAS URL': this.summaryObj.url,
                'Cipher': this.summaryObj.cipher,
            },
            'Source Dataset': this.summaryObj.source_datasets,
            'Target Dataset': this.summaryObj.target_dataset,
            'Recurisive': this.summaryObj.recursive,
            'Exclude Child Datasets': this.summaryObj.exclude,
            'Periodic Snapshot Tasks': this.summaryObj.periodic_snapshot_tasks,
            'New Periodic Snapshot Tasks': {
                'Dataset': this.summaryObj.dataset,
                'Recursive': this.summaryObj.recursive,
                'Snapshot Lifetime': this.summaryObj.lifetime_value + ' ' + this.summaryObj.lifetime_unit,
                'Schedule the Periodic Snapshot Task': this.summaryObj.snapshot_picker,
                'Begin': this.summaryObj.begin,
                'End': this.summaryObj.end,
            },
            'Run Automatically': this.summaryObj.auto,
            'Snapshot Retention Policy': this.summaryObj.retention_policy,
        };

        this.summaryObj.ssh_credentials === 'NEW' ? delete summary['SSH Connection'] : delete summary['New SSH Connection'];
        this.summaryObj.periodic_snapshot_tasks === 'NEW' ? delete summary['Periodic Snapshot Tasks'] : delete summary['New Periodic Snapshot Tasks'];

        return summary;
    }

    async customSubmit(value) {
        this.loader.open();
        let toStop = false;
        if (value['ssh_credentials'] == 'NEW' && value['setup_method'] == 'manual') {
            await this.getRemoteHostKey(value).then(
                (res) => {
                    value['remote_host_key'] = res;
                },
                (err) => {
                    toStop = true;
                    new EntityUtils().handleWSError(this, err, this.dialogService);
                }
            )
        }
 
        const createdItems = {
            ssh_credentials: null,
            // periodic_snapshot_tasks: null,
            // replication: null,
        }

        for (const item in createdItems) {
            if (!toStop) {
                if (!((item === 'ssh_credentials' && value['ssh_credentials'] !== 'NEW') || (item === 'periodic_snapshot_tasks' && value['periodic_snapshot_tasks'] !== 'NEW'))) {
                    await this.doCreate(value, item).then(
                        (res) => {
                            value[item] = res.id;
                            createdItems[item] = res.id;
                        },
                        (err) => {
                            new EntityUtils().handleWSError(this, err, this.dialogService);
                            toStop = true;
                            this.rollBack(createdItems);
                        }
                    )
                }
            }
        }

        this.loader.close();
        if (!toStop) {
            this.router.navigate(new Array('/').concat(this.route_success));
        }
    }

    getRemoteHostKey(value) {
        const payload = {
            'host': value['host'],
            'port': value['port'],
        };

        return this.ws.call('keychaincredential.remote_ssh_host_key_scan', [payload]).toPromise();
    }

    async doCreate(value, item) {
        let payload;
        if (item === 'ssh_credentials') {
            item += '_' + value['setup_method'];
            if (value['setup_method'] == 'manual') {
                payload = {
                    name: value['name'],
                    type: 'SSH_CREDENTIALS',
                    attributes: {
                        cipher: value['cipher'],
                        host: value['host'],
                        port: value['port'],
                        private_key: value['private_key'],
                        remote_host_key: value['remote_host_key'],
                        username: value['username'],
                    }
                };
            } else {
                payload = {
                    name: value['name'],
                    private_key: value['private_key'],
                    cipher: value['cipher'],
                };
                for (const i of this.semiSSHFieldGroup) {
                    payload[i] = value[i];
                }
            }
        }

        if (item === 'periodic_snapshot_tasks') {
            
        }
        if (item === 'replication') {
            
        }
       
        return this.ws.call(this.createCalls[item], [payload]).toPromise();
    }

    rollBack(items) {
        for (const item in items) {
            if (items[item] != null) {
                this.ws.call(this.deleteCalls[item], [items[item]]).subscribe(
                    (res) => {
                        console.log('rollback ' + item, res);
                    }
                );
            }
        }
    }
}