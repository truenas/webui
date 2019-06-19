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
                {
                    type: 'input',
                    name: 'netcat_active_side',
                    value: 'REMOTE',
                    isHidden: true,
                },
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
                    placeholder: sshConnectionsHelptex.password_placeholder,
                    tooltip: sshConnectionsHelptex.password_tooltip,
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
                            label: 'Generate New',
                            value: 'NEW'
                        }
                    ],
                    required: true,
                    validation: [Validators.required],
                }, {
                    type: 'input',
                    name: 'remote_host_key',
                    isHidden: true,
                }, {
                    type: 'select',
                    name: 'cipher',
                    placeholder: helptext.cipher_placeholder,
                    tooltip: helptext.cipher_tooltip,
                    options: [
                        {
                            label: 'Standard (Secure)',
                            value: 'STANDARD',
                        }, {
                            label: 'Fast (Less secure)',
                            value: 'FAST',
                        }, {
                            label: 'Disabled (Not encrypted)',
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
                    type: 'input',
                    name: 'naming_schema',
                    placeholder: replicationHelptext.naming_schema_placeholder,
                    tooltip: replicationHelptext.naming_schema_tooltip,
                    required: true,
                    validation: [Validators.required],
                },
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
                    name: 'snapshot_begin',
                    placeholder: snapshotHelptext.begin_placeholder,
                    tooltip: snapshotHelptext.begin_tooltip,
                    options: [],
                    value: '09:00',
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'select',
                    name: 'snapshot_end',
                    placeholder: snapshotHelptext.end_placeholder,
                    tooltip: snapshotHelptext.end_tooltip,
                    options: [],
                    value: '18:00',
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'explorer',
                    initial: '/mnt',
                    explorerType: 'directory',
                    multiple: true,
                    name: 'source_datasets_PUSH',
                    placeholder: replicationHelptext.source_datasets_placeholder,
                    tooltip: replicationHelptext.source_datasets_tooltip,
                    options: [],
                    required: true,
                    validation: [Validators.required],
                    isHidden: true,
                },
                {
                    type: 'explorer',
                    name: 'target_dataset_PUSH',
                    placeholder: replicationHelptext.target_dataset_placeholder,
                    tooltip: replicationHelptext.target_dataset_tooltip,
                    initial: '',
                    explorerType: 'directory',
                    customTemplateStringOptions: {
                        displayField: 'Path',
                        isExpandedField: 'expanded',
                        idField: 'uuid',
                        getChildren: this.getChildren.bind(this),
                        nodeHeight: 23,
                        allowDrag: false,
                        useVirtualScroll: false,
                    },
                    required: true,
                    validation: [Validators.required],
                    isHidden: true,
                },
                {
                    type: 'explorer',
                    name: 'source_datasets_PULL',
                    placeholder: replicationHelptext.source_datasets_placeholder,
                    tooltip: replicationHelptext.source_datasets_placeholder,
                    initial: '',
                    explorerType: 'directory',
                    customTemplateStringOptions: {
                        displayField: 'Path',
                        isExpandedField: 'expanded',
                        idField: 'uuid',
                        getChildren: this.getChildren.bind(this),
                        nodeHeight: 23,
                        allowDrag: false,
                        useVirtualScroll: false,
                    },
                    required: true,
                    validation: [Validators.required],
                    isHidden: true,
                },
                {
                    type: 'explorer',
                    initial: '/mnt',
                    explorerType: 'directory',
                    name: 'target_dataset_PULL',
                    placeholder: replicationHelptext.target_dataset_placeholder,
                    tooltip: replicationHelptext.target_dataset_placeholder,
                    options: [],
                    required: true,
                    validation: [Validators.required],
                    isHidden: true,
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
                    type: 'scheduler',
                    name: 'schedule_picker',
                    tooltip: replicationHelptext.schedule_picker_tooltip,
                    validation: [Validators.required],
                    required: true,
                    value: "0 0 * * *"
                },
                {
                    type: 'select',
                    name: 'begin',
                    placeholder: replicationHelptext.schedule_begin_placeholder,
                    tooltip: replicationHelptext.schedule_begin_tooltip,
                    options: [],
                    value: '09:00',
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'select',
                    name: 'end',
                    placeholder: replicationHelptext.schedule_end_placeholder,
                    tooltip: replicationHelptext.schedule_end_tooltip,
                    options: [],
                    value: '18:00',
                    required: true,
                    validation: [Validators.required],
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

    protected scheduleFieldGroup: any[] = [
        'schedule_picker',
        'begin',
        'end',
    ];

    protected transportSSHnetcatFieldGroup: any[] = [
        'netcat_active_side',
        // 'netcat_active_side_listen_address',
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
        'snapshot_begin',
        'snapshot_end',
    ];
    protected replicationFieldGroup: any[] = [
        'direction',
        'source_datasets_PUSH',
        'target_dataset_PUSH',
        'source_datasets_PULL',
        'target_dataset_PULL',
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
        'snapshot_begin': null,
        'snapshot_end': null,
        'direction': null,
        'source_datasets_PUSH': null,
        'target_dataset_PUSH': null,
        'source_datasets_PULL': null,
        'target_dataset_PULL': null,
        'recursive': null,
        'exclude': null,
        'auto': null,
        'retention_policy': null,
        'enabled': null,
        'naming_schema': null,
        'schedule_picker': null,
        'begin': null,
        'end': null,
    };

    protected createCalls = {
        private_key: 'keychaincredential.create',
        ssh_credentials_semiautomatic: 'keychaincredential.remote_ssh_semiautomatic_setup',
        ssh_credentials_manual:'keychaincredential.create',
        periodic_snapshot_tasks: 'pool.snapshottask.create',
        replication: 'replication.create',
    }

    protected deleteCalls = {
        private_key: 'keychaincredential.delete',
        ssh_credentials: 'keychaincredential.delete',
        periodic_snapshot_tasks: 'pool.snapshottask.delete',
        replication: 'replication.delete',
    }

    protected availSnapshottasks: any;

    constructor(private router: Router, private keychainCredentialService: KeychainCredentialService,
        private loader: AppLoaderService, private dialogService: DialogService,
        private ws: WebSocketService, private replicationService: ReplicationService,
        private taskService: TaskService) { }

    isCustActionVisible(id, stepperIndex) {
        if (stepperIndex == 0) {
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
            this.disablefieldGroup(this.transportSSHnetcatFieldGroup, ssh, 0);
            if (this.entityWizard.formArray.controls[0].controls['ssh_credentials'].value === 'NEW') {
                this.disablefieldGroup(['cipher'], !ssh, 0);
            } else if (this.entityWizard.formArray.controls[0].controls['ssh_credentials'].value != '') {
                this.disablefieldGroup(['cipher'], !this.entityWizard.formArray.controls[0].controls['ssh_credentials'].disabled, 0);
            }
        });
        this.entityWizard.formArray.controls[0].controls['ssh_credentials'].valueChanges.subscribe((value) => {
            const newSSH = value == 'NEW' ? true : false;
            this.disablefieldGroup([...this.sshFieldGroup, ...this.semiSSHFieldGroup, ...this.manualSSHFieldGroup], !newSSH, 0);
            if (newSSH) {
                this.disablefieldGroup(['cipher'], this.entityWizard.formArray.controls[0].controls['transport'].value === 'SSH+NETCAT', 0);
                this.entityWizard.formArray.controls[0].controls['setup_method'].setValue(this.entityWizard.formArray.controls[0].controls['setup_method'].value);
            }

            for (const item of ['target_dataset_PUSH', 'source_datasets_PULL']) {
                const explorerComponent = _.find(this.wizardConfig[1].fieldConfig, {name: item}).customTemplateStringOptions.explorerComponent;
                if (explorerComponent) {
                    explorerComponent.nodes = [{
                        mountpoint: explorerComponent.config.initial,
                        name: explorerComponent.config.initial,
                        hasChildren: true
                    }];
                }
            }

        });
        this.entityWizard.formArray.controls[0].controls['setup_method'].valueChanges.subscribe((value) => {
            const manual = value == 'manual' ? true : false;
            this.disablefieldGroup(this.semiSSHFieldGroup, manual, 0);
            this.disablefieldGroup(this.manualSSHFieldGroup, !manual, 0);
        });

        this.entityWizard.formArray.controls[0].controls['setup_method'].setValue('semiautomatic');
        this.entityWizard.formArray.controls[0].controls['ssh_credentials'].setValue('');
        this.entityWizard.formArray.controls[0].controls['transport'].setValue('SSH');
    }

    step1Init() {
        const periodicSnapshotTasksField = _.find(this.wizardConfig[1].fieldConfig, { name: 'periodic_snapshot_tasks' });
        this.replicationService.getSnapshotTasks().subscribe(
            (res) => {
                this.availSnapshottasks = res;
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

        const snapshot_begin_field = _.find(this.wizardConfig[1].fieldConfig, { name: 'snapshot_begin' });
        const snapshot_end_field = _.find(this.wizardConfig[1].fieldConfig, { name: 'snapshot_end' });
        const begin_field = _.find(this.wizardConfig[1].fieldConfig, { name: 'begin' });
        const end_field = _.find(this.wizardConfig[1].fieldConfig, { name: 'end' });
        const time_options = this.taskService.getTimeOptions();
        for (let i = 0; i < time_options.length; i++) {
            snapshot_begin_field.options.push({ label: time_options[i].label, value: time_options[i].value });
            snapshot_end_field.options.push({ label: time_options[i].label, value: time_options[i].value });
            begin_field.options.push({ label: time_options[i].label, value: time_options[i].value });
            end_field.options.push({ label: time_options[i].label, value: time_options[i].value });
        }

        this.entityWizard.formArray.controls[1].controls['direction'].valueChanges.subscribe((value) => {
            const disablePull = value == 'PUSH' ? true : false;
            this.disablefieldGroup(['naming_schema'], disablePull, 1);
            this.disablefieldGroup(this.scheduleFieldGroup, disablePull || this.entityWizard.formArray.controls[1].controls['auto'].value == false, 1);
            this.disablefieldGroup(['periodic_snapshot_tasks'], !disablePull, 1);

            this.disablefieldGroup(['source_datasets_PUSH', 'target_dataset_PUSH'], !disablePull, 1);
            this.disablefieldGroup(['source_datasets_PULL', 'target_dataset_PULL'], disablePull, 1);
        });

        this.entityWizard.formArray.controls[1].controls['periodic_snapshot_tasks'].valueChanges.subscribe((value) => {
            const newSnapshot = (value == 'NEW' && this.entityWizard.formArray.controls[1].controls['direction'].value == 'PUSH') ? true : false;
            this.disablefieldGroup(this.snapshotFieldGroup, !newSnapshot, 1);

            if (!newSnapshot) {
                const snapshottask = _.find(this.availSnapshottasks, {'id': value});
                if (snapshottask) {
                    const prop = this.entityWizard.formArray.controls[1].controls['direction'].value == 'PUSH' ? 'source_datasets_PUSH' : 'target_dataset_PULL';
                    this.entityWizard.formArray.controls[1].controls[prop].setValue(snapshottask['dataset']);
                }
            }
        });

        this.entityWizard.formArray.controls[1].controls['recursive'].valueChanges.subscribe((value) => {
            this.disablefieldGroup(['exclude'], !value, 1);
        });
        this.entityWizard.formArray.controls[1].controls['auto'].valueChanges.subscribe((value) => {
            this.disablefieldGroup(this.scheduleFieldGroup, value == false || this.entityWizard.formArray.controls[1].controls['direction'].value == 'PUSH', 1);
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
                        if (value == undefined || (<FormControl>control).disabled) {
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
            'Source Dataset': this.summaryObj['source_datasets_' + this.summaryObj.direction],
            'Target Dataset': this.summaryObj['target_dataset_' + this.summaryObj.direction],
            'Recurisive': this.summaryObj.recursive,
            'Exclude Child Datasets': this.summaryObj.exclude,
            'Periodic Snapshot Tasks': this.summaryObj.periodic_snapshot_tasks,
            'New Periodic Snapshot Tasks': {
                'Dataset': this.summaryObj.dataset,
                'Recursive': this.summaryObj.recursive,
                'Snapshot Lifetime': this.summaryObj.lifetime_value + ' ' + this.summaryObj.lifetime_unit,
                'Schedule the Periodic Snapshot Task': this.summaryObj.snapshot_picker,
                'Begin': this.summaryObj.snapshot_begin,
                'End': this.summaryObj.snapshot_end,
            },
            'Naming Schema': this.summaryObj.naming_schema,
            'Run Automatically': this.summaryObj.auto,
            'Schedule the Replication Task': this.summaryObj.schedule_picker,
            'Begin': this.summaryObj.begin,
            'End': this.summaryObj.end,
            'Snapshot Retention Policy': this.summaryObj.retention_policy,
        };

        this.summaryObj.ssh_credentials === 'Create New' ? delete summary['SSH Connection'] : delete summary['New SSH Connection'];
        this.summaryObj.periodic_snapshot_tasks === 'Create New' ? delete summary['Periodic Snapshot Tasks'] : delete summary['New Periodic Snapshot Tasks'];

        if (this.summaryObj.direction === 'PUSH') {
            delete summary['Naming Schema'];
            delete summary['Schedule the Replication Task'];
            delete summary['Begin'];
            delete summary['End'];
        } else if (this.summaryObj.direction === 'PULL') {
            delete summary['Periodic Snapshot Task'];
            delete summary['New Periodic Snapshot Tasks'];
            if (this.summaryObj.auto == false) {
                delete summary['Schedule the Replication Task'];
                delete summary['Begin'];
                delete summary['End'];
            }
        }

        return summary;
    }

    async customSubmit(value) {
        this.loader.open();
        let toStop = false;
        if (value['ssh_credentials'] == 'NEW' && value['private_key'] == 'NEW') {
            await this.replicationService.genSSHKeypair().then(
                (res) => {
                    value['sshkeypair'] = res;
                },
                (err) => {
                    toStop = true;
                    new EntityUtils().handleWSError(this, err, this.dialogService);
                }
            )
        }
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
            private_key: null,
            ssh_credentials: null,
            periodic_snapshot_tasks: null,
            replication: null,
        }

        for (const item in createdItems) {
            if (!toStop) {
                if (!((item === 'private_key' && value['private_key'] !== 'NEW') || (item === 'ssh_credentials' && value['ssh_credentials'] !== 'NEW') || (item === 'periodic_snapshot_tasks' && value['periodic_snapshot_tasks'] !== 'NEW'))) {
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

    parseLocalDS(value, prop) {
        value[prop] = typeof value[prop] === "string" ? value[prop].split(' ') : value[prop];
        for (let i = 0; i < value[prop].length; i++) {
            if (_.startsWith(value[prop][i], '/mnt/')) {
                value[prop][i] = value[prop][i].substring(5);
            }
        }
        return value[prop];
    }
    async doCreate(value, item) {
        let payload;
        if (item === 'private_key') {
            payload = {
                name: value['name'] + ' Key',
                type: 'SSH_KEY_PAIR',
                attributes: value['sshkeypair'],
            }
        }
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
            payload = {
                naming_schema: 'auto-%Y-%m-%d_%H-%M',
            };
            for (const i of this.snapshotFieldGroup) {
                if (i == 'snapshot_picker') {
                    payload['schedule'] = this.parsePickerTime(value['snapshot_picker'], value['snapshot_begin'], value['snapshot_end']);
                    delete value['snapshot_picker'];
                    delete value['snapshot_begin'];
                    delete value['snapshot_end'];
                } else if (i == 'snapshot_recursive') {
                    payload['recursive'] = value[i];
                } else {
                    payload[i] = value[i];
                }
            }
        }
        if (item === 'replication') {
            payload = {
                name: value['name'],
                ssh_credentials: value['ssh_credentials'],
                transport: value['transport'],
            }

            if (value['direction'] == 'PUSH') {
                payload['source_datasets'] = this.parseLocalDS(value, 'source_datasets_PUSH');
                payload['target_dataset'] = value['target_dataset_PUSH'];

                payload["periodic_snapshot_tasks"] = value['periodic_snapshot_tasks'].toString().split(' ');
            } else {
                payload['source_datasets'] =  value['source_datasets_PULL'].split(' ');
                payload['target_dataset'] = this.parseLocalDS(value, 'target_dataset_PULL').join(' ');

                payload['naming_schema'] = value['naming_schema'].split(' ');
                if (value['schedule_picker']) {
                    payload['schedule'] = this.parsePickerTime(value['schedule_picker'], value['begin'], value['end']);
                }
            }
            if (value['transport'] == 'SSH+NETCAT') {
                for (const i of this.transportSSHnetcatFieldGroup) {
                    payload[i] = value[i];
                }
            }
            for (const i of this.replicationFieldGroup) {
                if (!i.includes('dataset')) {
                    payload[i] = value[i];
                }
            }
        }

        return this.ws.call(this.createCalls[item], [payload]).toPromise();
    }

    async rollBack(items) {
        const keys = Object.keys(items).reverse();
        for (let i = 0; i < keys.length; i++) {
            if (items[keys[i]] != null) {
                await this.ws.call(this.deleteCalls[keys[i]], [items[keys[i]]]).toPromise().then(
                    (res) => {
                        console.log('rollback ' + keys[i], res);
                    }
                );
            }
        }
    }

    parsePickerTime(picker, begin, end) {
        const spl = picker.split(" ");
        return {
            minute: spl[0],
            hour: spl[1],
            dom: spl[2],
            month: spl[3],
            dow: spl[4],
            begin: begin,
            end: end,
        };
    }

    getChildren(node) {
        const transport = this.entityWizard.formArray.controls[0].controls['transport'].value;
        const sshCredentials = this.entityWizard.formArray.controls[0].controls['ssh_credentials'].value;
        return new Promise((resolve, reject) => {
            resolve(this.replicationService.getRemoteDataset(transport,sshCredentials, this));
        });
    }
}
