import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Validators, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';

import * as _ from 'lodash';

import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import helptext from '../../../../helptext/task-calendar/replication/replication-wizard';
import sshConnectionsHelptex from '../../../../helptext/system/ssh-connections';

import { DialogService, KeychainCredentialService, WebSocketService, ReplicationService, TaskService, StorageService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { T } from '../../../../translate-marker';
import { forbiddenValues } from '../../../common/entity/entity-form/validators/forbidden-values-validation';

@Component({
    selector: 'app-replication-wizard',
    template: `<entity-wizard [conf]="this"></entity-wizard>`,
    providers: [KeychainCredentialService, ReplicationService, TaskService, DatePipe, EntityFormService]
})
export class ReplicationWizardComponent {

    public route_success: string[] = ['tasks', 'replication'];
    public isLinear = true;
    public summary_title = "Replication Summary";
    protected entityWizard: any;

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

    protected namesInUse = [];
    protected defaultNamingSchema = 'auto-%Y-%m-%d_%H-%M';

    protected wizardConfig: Wizard[] = [
        {
            label: helptext.step1_label,
            fieldConfig: [
                {
                    type: 'select',
                    name: 'exist_replication',
                    placeholder: helptext.exist_replication_placeholder,
                    tooltip: helptext.exist_replication_tooltip,
                    options: [{
                        label: '---------',
                        value: '',
                    }],
                    value: '',
                },
                {
                    type: 'select',
                    name: 'source_datasets_from',
                    placeholder: helptext.source_datasets_from_placeholder,
                    tooltip: helptext.source_datasets_from_tooltip,
                    options: [{
                        label: 'On this System',
                        value: 'local',
                    }, {
                        label: 'On a Different System',
                        value: 'remote',
                    }],
                    required: true,
                    validation: [Validators.required],
                    class: 'inline',
                    width: '50%',
                },
                {
                    type: 'select',
                    name: 'target_dataset_from',
                    placeholder: helptext.target_dataset_from_placeholder,
                    tooltip: helptext.target_dataset_from_tooltip,
                    options: [{
                        label: 'On this System',
                        value: 'local',
                    }, {
                        label: 'On a Different System',
                        value: 'remote',
                    }],
                    required: true,
                    validation: [Validators.required],
                    class: 'inline',
                    width: '50%',
                },
                {
                    type: 'select',
                    name: 'ssh_credentials_source',
                    placeholder: helptext.ssh_credentials_source_placeholder,
                    tooltip: helptext.ssh_credentials_source_tooltip,
                    options: [],
                    class: 'inline',
                    width: '50%',
                    relation: [{
                        action: 'SHOW',
                        when: [{
                            name: 'source_datasets_from',
                            value: 'remote',
                        }]
                    }],
                    isHidden: true,
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'select',
                    name: 'ssh_credentials_target',
                    placeholder: helptext.ssh_credentials_target_placeholder,
                    tooltip: helptext.ssh_credentials_target_tooltip,
                    options: [],
                    class: 'inline',
                    width: '50%',
                    relation: [{
                        action: 'SHOW',
                        when: [{
                            name: 'target_dataset_from',
                            value: 'remote',
                        }]
                    }],
                    isHidden: true,
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'explorer',
                    name: 'source_datasets',
                    placeholder: helptext.source_datasets_placeholder,
                    tooltip: helptext.source_datasets_tooltip,
                    initial: '',
                    explorerType: 'directory',
                    multiple: true,
                    customTemplateStringOptions: {
                        displayField: 'Path',
                        isExpandedField: 'expanded',
                        idField: 'uuid',
                        getChildren: this.getSourceChildren.bind(this),
                        nodeHeight: 23,
                        allowDrag: false,
                        useVirtualScroll: false,
                        useCheckbox: true,
                        useTriState: false,
                    },
                    required: true,
                    validation: [Validators.required],
                    class: 'inline',
                    width: '50%',
                    relation: [{
                        action: 'SHOW',
                        connective: 'OR',
                        when: [{
                            name: 'source_datasets_from',
                            value: 'remote',
                        }, {
                            name: 'source_datasets_from',
                            value: 'local',
                        }]
                    }],
                },
                {
                    type: 'explorer',
                    name: 'target_dataset',
                    placeholder: helptext.target_dataset_placeholder,
                    tooltip: helptext.target_dataset_tooltip,
                    initial: '',
                    explorerType: 'directory',
                    customTemplateStringOptions: {
                        displayField: 'Path',
                        isExpandedField: 'expanded',
                        idField: 'uuid',
                        getChildren: this.getTargetChildren.bind(this),
                        nodeHeight: 23,
                        allowDrag: false,
                        useVirtualScroll: false,
                    },
                    required: true,
                    validation: [Validators.required],
                    class: 'inline',
                    width: '50%',
                    relation: [{
                        action: 'SHOW',
                        connective: 'OR',
                        when: [{
                            name: 'target_dataset_from',
                            value: 'remote',
                        }, {
                            name: 'target_dataset_from',
                            value: 'local',
                        }]
                    }],
                },
                {
                    type: 'checkbox',
                    name: 'recursive',
                    placeholder: helptext.recursive_placeholder,
                    tooltip: helptext.recursive_tooltip,
                    value: false,
                    relation: [{
                        action: 'SHOW',
                        connective: 'OR',
                        when: [{
                            name: 'source_datasets_from',
                            value: 'remote',
                        }, {
                            name: 'source_datasets_from',
                            value: 'local',
                        }]
                    }],
                },
                {
                    type: 'paragraph',
                    name: 'snapshots_count',
                    paraText: '',
                    relation: [{
                        action: 'SHOW',
                        connective: 'OR',
                        when: [{
                            name: 'source_datasets_from',
                            value: 'remote',
                        }, {
                            name: 'source_datasets_from',
                            value: 'local',
                        }]
                    }],
                },
                {
                    type: 'checkbox',
                    name: 'custom_snapshots',
                    placeholder: helptext.custom_snapshots_placeholder,
                    tooltip: helptext.custom_snapshots_tooltip,
                    value: false,
                    relation: [{
                        action: 'SHOW',
                        when: [{
                            name: 'source_datasets_from',
                            value: 'local',
                        }]
                    }],
                },
                {
                    type: 'input',
                    name: 'naming_schema',
                    placeholder: helptext.naming_schema_placeholder,
                    tooltip: helptext.naming_schema_tooltip,
                    value: this.defaultNamingSchema,
                    relation: [{
                        action: 'SHOW',
                        connective: 'OR',
                        when: [{
                            name: 'custom_snapshots',
                            value: true,
                        }, {
                            name: 'source_datasets_from',
                            value: 'remote',
                        }]
                    }],
                    parent: this,
                    blurStatus: true,
                    blurEvent: (parent) => {
                        parent.getSnapshots();
                    }
                },
                {
                    type: 'radio',
                    name: 'transport',
                    placeholder: helptext.encryption_placeholder,
                    tooltip: helptext.encryption_tooltip,
                    options: [
                        {
                            label: 'Encryption (more secure, but slower)',
                            value: 'SSH',
                        },
                        {
                            label: 'No Encryption (less secure, but faster)',
                            value: 'SSH+NETCAT',
                        }
                    ],
                    value: 'SSH',
                    relation: [{
                        action: 'SHOW',
                        connective: 'OR',
                        when: [{
                            name: 'source_datasets_from',
                            value: 'remote',
                        }, {
                            name: 'target_dataset_from',
                            value: 'remote',
                        }]
                    }],
                },
                {
                    type: 'input',
                    name: 'name',
                    placeholder: helptext.name_placeholder,
                    tooltip: helptext.name_tooltip,
                    required: true,
                    validation: [Validators.required, forbiddenValues(this.namesInUse)],
                },
            ]
        },
        {
            label: helptext.step2_label,
            fieldConfig: [
                {
                    type: 'radio',
                    name: 'schedule_method',
                    placeholder: helptext.schedule_method_placeholder,
                    tooltip: helptext.schedule_method_tooltip,
                    options: [{
                        label: 'Run On a Schedule',
                        value: 'cron',
                    }, {
                        label: 'Run Once',
                        value: 'once',
                    }],
                    value: 'cron',
                    class: 'inline',
                    width: '50%',
                },
                {
                    type: 'scheduler',
                    name: 'schedule_picker',
                    placeholder: helptext.schedule_placeholder,
                    tooltip: helptext.schedule_tooltip,
                    value: "0 0 * * *",
                    class: 'inline',
                    width: '50%',
                    relation: [{
                        action: 'SHOW',
                        when: [{
                            name: 'schedule_method',
                            value: 'cron',
                        }]
                    }],
                    required: true,
                    validation: [Validators.required],
                },
                {
                    type: 'radio',
                    name: 'retention_policy',
                    placeholder: helptext.retention_policy_placeholder,
                    tooltip: helptext.retention_policy_tooltip,
                    options: [{
                        label: 'Same as Source',
                        value: 'SOURCE',
                    }, {
                        label: 'Never Delete',
                        value: 'NONE',
                    }, {
                        label: 'Custom',
                        value: 'CUSTOM',
                    }],
                    value: 'SOURCE',
                    class: 'inline',
                    width: '50%',
                },
                {
                    placeholder: helptext.lifetime_value_placeholder,
                    type: 'input',
                    name: 'lifetime_value',
                    inputType: 'number',
                    value: 2,
                    required: true,
                    validation: [Validators.required, Validators.min(0)],
                    class: 'inline',
                    width: '25%',
                    relation: [{
                        action: 'SHOW',
                        connective: 'OR',
                        when: [{
                            name: 'retention_policy',
                            value: 'CUSTOM',
                        }]
                    }],
                },
                {
                    type: 'select',
                    name: 'lifetime_unit',
                    tooltip: helptext.lifetime_unit_tooltip,
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
                    width: '25%',
                    relation: [{
                        action: 'SHOW',
                        connective: 'OR',
                        when: [{
                            name: 'retention_policy',
                            value: 'CUSTOM',
                        }]
                    }],
                    required: true,
                    validation: [Validators.required],
                },
            ]
        }
    ];

    protected dialogFieldConfig = [
        {
            type: 'input',
            name: 'name',
            placeholder: sshConnectionsHelptex.name_placeholder,
            tooltip: sshConnectionsHelptex.name_tooltip,
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
            value: 'semiautomatic',
            isHidden: false,
        },
        {
            type: 'input',
            name: 'host',
            placeholder: sshConnectionsHelptex.host_placeholder,
            tooltip: sshConnectionsHelptex.host_tooltip,
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
            placeholder: sshConnectionsHelptex.port_placeholder,
            tooltip: sshConnectionsHelptex.port_tooltip,
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
            placeholder: sshConnectionsHelptex.url_placeholder,
            tooltip: sshConnectionsHelptex.url_tooltip,
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
    ];

    protected saveSubmitText = 'START REPLICATION';
    protected directions = ['PULL', 'PUSH'];
    protected selectedReplicationTask: any;
    protected semiSSHFieldGroup: any[] = [
        'url',
        'password',
    ];

    protected createCalls = {
        private_key: 'keychaincredential.create',
        ssh_credentials_semiautomatic: 'keychaincredential.remote_ssh_semiautomatic_setup',
        ssh_credentials_manual: 'keychaincredential.create',
        periodic_snapshot_tasks: 'pool.snapshottask.create',
        replication: 'replication.create',
        snapshot: 'zfs.snapshot.create',
    }

    protected deleteCalls = {
        private_key: 'keychaincredential.delete',
        ssh_credentials: 'keychaincredential.delete',
        periodic_snapshot_tasks: 'pool.snapshottask.delete',
        replication: 'replication.delete',
    }

    protected snapshotsCountField;
    private existSnapshotTasks = [];
    private eligibleSnapshots = 0;

    constructor(private router: Router, private keychainCredentialService: KeychainCredentialService,
        private loader: AppLoaderService, private dialogService: DialogService,
        private ws: WebSocketService, private replicationService: ReplicationService,
        private taskService: TaskService, private storageService: StorageService,
        private datePipe: DatePipe, private entityFormService: EntityFormService) {
        this.ws.call('replication.query').subscribe(
            (res) => {
                this.namesInUse.push(...res.map(replication => replication.name));
            }
        )
    }

    isCustActionVisible(id, stepperIndex) {
        if (stepperIndex == 0) {
            return true;
        }
        return false;
    }

    afterInit(entityWizard) {
        this.entityWizard = entityWizard;
        this.snapshotsCountField = _.find(this.wizardConfig[0].fieldConfig, { name: 'snapshots_count' });
        this.step0Init();
        this.step1Init();
    }

    step0Init() {
        const exist_replicationField = _.find(this.wizardConfig[0].fieldConfig, { name: 'exist_replication' });
        this.replicationService.getReplicationTasks().subscribe(
            (res) => {
                for (const task of res) {
                    const lable = task.name + ' (' + ((task.state && task.state.datetime) ? 'last run ' + this.datePipe.transform(new Date(task.state.datetime.$date), 'MM/dd/yyyy') : 'never ran') + ')';
                    exist_replicationField.options.push({ label: lable, value: task });
                }
            }
        )

        const privateKeyField = _.find(this.dialogFieldConfig, { name: 'private_key' });
        this.keychainCredentialService.getSSHKeys().subscribe(
            (res) => {
                for (const i in res) {
                    privateKeyField.options.push({ label: res[i].name, value: res[i].id });
                }
            }
        )

        const ssh_credentials_source_field = _.find(this.wizardConfig[0].fieldConfig, { 'name': 'ssh_credentials_source' });
        const ssh_credentials_target_field = _.find(this.wizardConfig[0].fieldConfig, { 'name': 'ssh_credentials_target' });
        this.keychainCredentialService.getSSHConnections().subscribe((res) => {
            for (const i in res) {
                ssh_credentials_source_field.options.push({ label: res[i].name, value: res[i].id });
                ssh_credentials_target_field.options.push({ label: res[i].name, value: res[i].id });
            }
            ssh_credentials_source_field.options.push({ label: 'Create New', value: 'NEW' });
            ssh_credentials_target_field.options.push({ label: 'Create New', value: 'NEW' });
        })

        this.entityWizard.formArray.controls[0].controls['exist_replication'].valueChanges.subscribe((value) => {
            if (value !== null) {
                if (value !== undefined && value !== '') {
                    this.loadReplicationTask(value);
                } else {
                    if (this.selectedReplicationTask !== undefined && this.selectedReplicationTask !== '') {
                        this.clearReplicationTask();
                    }
                }
                this.selectedReplicationTask = value;
            }
        });
        this.entityWizard.formArray.controls[0].controls['source_datasets'].valueChanges.subscribe((value) => {
            this.genTaskName();
            this.getSnapshots();
        });
        this.entityWizard.formArray.controls[0].controls['target_dataset'].valueChanges.subscribe((value) => {
            this.genTaskName();
        });

        for (const i of ['source', 'target']) {
            const credentialName = 'ssh_credentials_' + i;
            const datasetName = i === 'source' ? 'source_datasets' : 'target_dataset';
            const datasetFrom = datasetName + '_from';
            this.entityWizard.formArray.controls[0].controls[datasetFrom].valueChanges.subscribe((value) => {
                if (value === 'remote') {
                    if (datasetFrom === 'source_datasets_from') {
                        this.entityWizard.formArray.controls[0].controls['target_dataset_from'].setValue('local');
                        this.setDisable('target_dataset_from', true, false, 0);
                    }
                    const disabled = this.entityWizard.formArray.controls[0].controls[credentialName].value ? false : true;
                    this.setDisable(datasetName, disabled, false, 0);
                } else {
                    if (datasetFrom === 'source_datasets_from' && this.entityWizard.formArray.controls[0].controls['target_dataset_from'].disabled) {
                        this.setDisable('target_dataset_from', false, false, 0);
                    }
                    this.setDisable(datasetName, false, false, 0);
                }
            });

            this.entityWizard.formArray.controls[0].controls[credentialName].valueChanges.subscribe((value) => {
                if (value === 'NEW' && this.entityWizard.formArray.controls[0].controls[datasetFrom].value === 'remote') {
                    this.createSSHConnection(credentialName);
                    this.setDisable(datasetName, false, false, 0);
                } else {
                    const explorerComponent = _.find(this.wizardConfig[0].fieldConfig, { name: datasetName }).customTemplateStringOptions.explorerComponent;
                    if (explorerComponent) {
                        explorerComponent.nodes = [{
                            mountpoint: explorerComponent.config.initial,
                            name: explorerComponent.config.initial,
                            hasChildren: true
                        }];
                        this.entityWizard.formArray.controls[0].controls[datasetName].setValue('');
                    }
                    this.setDisable(datasetName, false, false, 0);
                }
            });
        }

        this.entityWizard.formArray.controls[0].controls['recursive'].valueChanges.subscribe((value) => {
            const explorerComponent = _.find(this.wizardConfig[0].fieldConfig, { name: 'source_datasets' }).customTemplateStringOptions;
            if (explorerComponent) {
                explorerComponent.useTriState = value;
            }
        });

        this.entityWizard.formArray.controls[0].controls['custom_snapshots'].valueChanges.subscribe((value) => {
            this.setDisable('naming_schema', !value, !value, 0);
            if (!value) {
                this.getSnapshots();
            }
        });
    }

    step1Init() {
        this.entityWizard.formArray.controls[1].controls['retention_policy'].valueChanges.subscribe((value) => {
            const disable = value === 'SOURCE' ? true : false;
            disable ? this.entityWizard.formArray.controls[1].controls['lifetime_value'].disable() : this.entityWizard.formArray.controls[1].controls['lifetime_value'].enable();
            disable ? this.entityWizard.formArray.controls[1].controls['lifetime_unit'].disable() : this.entityWizard.formArray.controls[1].controls['lifetime_unit'].enable();
        });
    }

    getSourceChildren(node) {
        const fromLocal = this.entityWizard.formArray.controls[0].controls['source_datasets_from'].value === 'local' ? true : false;
        const sshCredentials = this.entityWizard.formArray.controls[0].controls['ssh_credentials_source'].value;

        if (fromLocal) {
            return new Promise((resolve, reject) => {
                resolve(this.entityFormService.getPoolDatasets());
            });
        } else {
            if (sshCredentials === 'NEW') {
                return this.entityWizard.formArray.controls[0].controls['ssh_credentials_source'].setErrors({});
            }
            return new Promise((resolve, reject) => {
                this.replicationService.getRemoteDataset('SSH', sshCredentials, this).then(
                    (res) => {
                        resolve(res);
                    },
                    (err) => {
                        node.collapse();
                    })
            });
        }
    }

    getTargetChildren(node) {
        const fromLocal = this.entityWizard.formArray.controls[0].controls['target_dataset_from'].value === 'local' ? true : false;
        const sshCredentials = this.entityWizard.formArray.controls[0].controls['ssh_credentials_target'].value;
        if (fromLocal) {
            return new Promise((resolve, reject) => {
                resolve(this.entityFormService.getPoolDatasets());
            });
        } else {
            if (sshCredentials === 'NEW') {
                return this.entityWizard.formArray.controls[0].controls['ssh_credentials_target'].setErrors({});
            }
            return new Promise((resolve, reject) => {
                this.replicationService.getRemoteDataset('SSH', sshCredentials, this).then(
                    (res) => {
                        resolve(res);
                    },
                    (err) => {
                        node.collapse();
                    })
            });
        }
    }

    setDisable(field: any, disabled: boolean, isHidden: boolean, stepIndex: number) {
        const control: any = _.find(this.wizardConfig[stepIndex].fieldConfig, { 'name': field });
        control['isHidden'] = isHidden;
        control.disabled = disabled;
        disabled ? this.entityWizard.formArray.controls[stepIndex].controls[field].disable() : this.entityWizard.formArray.controls[stepIndex].controls[field].enable();
    }

    loadReplicationTask(task) {
        if (task.direction === 'PUSH') {
            task['source_datasets_from'] = 'local';
            task['target_dataset_from'] = task.ssh_credentials ? 'remote' : 'local';
            if (task.ssh_credentials) {
                task['ssh_credentials_target'] = task.ssh_credentials.id;
            }
        } else {
            task['source_datasets_from'] = 'remote';
            task['target_dataset_from'] = 'local';
            task['ssh_credentials_source'] = task.ssh_credentials.id;
        }

        for (let i of ['source_datasets_from', 'target_dataset_from', 'ssh_credentials_source', 'ssh_credentials_target', 'transport', 'source_datasets', 'target_dataset']) {
            const ctrl = this.entityWizard.formArray.controls[0].controls[i];
            if (ctrl && !ctrl.disabled) {
                ctrl.setValue(task[i]);
            }
        }

        if (task.schedule || task.periodic_snapshot_tasks.length > 0) {
            const scheduleData = task.periodic_snapshot_tasks[0] || task;
            task['schedule_method'] = 'cron';
            task['schedule_picker'] = scheduleData.schedule ?
            scheduleData.schedule.minute + " " +
            scheduleData.schedule.hour + " " +
            scheduleData.schedule.dom + " " +
            scheduleData.schedule.month + " " +
            scheduleData.schedule.dow : null;

            if (scheduleData['lifetime_value'] === null && scheduleData['lifetime_unit'] === null) {
                task['retention_policy'] = 'NONE';
            } else {
                task['lifetime_value'] = scheduleData['lifetime_value'];
                task['lifetime_unit'] = scheduleData['lifetime_unit'];
                task['retention_policy'] = task.schedule !== null ? 'CUSTOM' : 'SOURCE';
            }
        } else {
            task['schedule_method'] = 'once';
        }
        // periodic_snapshot_tasks
        for (let i of ['schedule_method', 'schedule_picker', 'retention_policy', 'lifetime_value', 'lifetime_unit']) {
            const ctrl = this.entityWizard.formArray.controls[1].controls[i];
            if (ctrl && !ctrl.disabled) {
                ctrl.setValue(task[i]);
            }
        }
    }

    clearReplicationTask() {
        this.entityWizard.formArray.reset();
        for (let i = 0; i < this.entityWizard.formArray.controls.length; i++) {
            for (const item in this.entityWizard.formArray.controls[i].controls) {
                const itemConf = _.find(this.wizardConfig[i].fieldConfig, { name: item });
                if (itemConf.value !== undefined && item !== "exist_replication") {
                    this.entityWizard.formArray.controls[i].controls[item].setValue(itemConf.value);
                }
            }
        }
    }

    parsePickerTime(picker) {
        const spl = picker.split(" ");
        return {
            minute: spl[0],
            hour: spl[1],
            dom: spl[2],
            month: spl[3],
            dow: spl[4],
        };
    }

    async doCreate(data, item) {
        let payload;
        if (item === 'private_key') {
            payload = {
                name: data['name'] + ' Key',
                type: 'SSH_KEY_PAIR',
                attributes: data['sshkeypair'],
            }
            return this.ws.call(this.createCalls[item], [payload]).toPromise();
        }

        if (item === 'ssh_credentials') {
            item += '_' + data['setup_method'];
            if (data['setup_method'] == 'manual') {
                payload = {
                    name: data['name'],
                    type: 'SSH_CREDENTIALS',
                    attributes: {
                        cipher: data['cipher'],
                        host: data['host'],
                        port: data['port'],
                        private_key: data['private_key'],
                        remote_host_key: data['remote_host_key'],
                        username: data['username'],
                    }
                };
            } else {
                payload = {
                    name: data['name'],
                    private_key: data['private_key'],
                    cipher: data['cipher'],
                };
                for (const i of this.semiSSHFieldGroup) {
                    payload[i] = data[i];
                }
            }
            return this.ws.call(this.createCalls[item], [payload]).toPromise();
        }

        if (item === 'periodic_snapshot_tasks') {
            this.existSnapshotTasks = [];
            const snapshotPromises = [];
            for (const dataset of data['source_datasets']) {
                payload = {
                    dataset: dataset,
                    recursive: data['recursive'],
                    schedule: this.parsePickerTime(data['schedule_picker']),
                    lifetime_value: 2,
                    lifetime_unit: 'WEEK',
                    naming_schema: this.defaultNamingSchema,
                    enabled: true,
                };
                await this.isSnapshotTaskExist(payload).then(
                    (res) => {
                        if (res.length === 0) {
                            snapshotPromises.push(this.ws.call(this.createCalls[item], [payload]).toPromise());
                        } else {
                            this.existSnapshotTasks.push(...res.map(task => task.id));
                        }
                    }
                )
            }
            return Promise.all(snapshotPromises);
        }

        if (item === 'snapshot') {
            const snapshotPromises = [];
            for (const dataset of data['source_datasets']) {
                payload = {
                    dataset: dataset,
                    naming_schema: this.defaultNamingSchema,
                }
                snapshotPromises.push(this.ws.call(this.createCalls[item], [payload]).toPromise());
            }
            return Promise.all(snapshotPromises);
        }

        if (item === 'replication') {
            payload = {
                name: data['name'],
                direction: data['source_datasets_from'] === 'remote' ? 'PULL' : 'PUSH',
                source_datasets: data['source_datasets'],
                target_dataset: data['target_dataset'],
                ssh_credentials: data['ssh_credentials_source'] || data['ssh_credentials_target'],
                transport: data['transport'] ? data['transport'] : 'LOCAL',
                retention_policy: data['retention_policy'],
                recursive: data['recursive'],
            }

            // schedule option
            if (data['schedule_method'] === 'cron') {
                payload['auto'] = true;
                if (payload['direction'] === 'PULL') {
                    payload['schedule'] = this.parsePickerTime(data['schedule_picker']);
                    payload['naming_schema'] = [this.defaultNamingSchema]; //default?
                } else {
                    payload['periodic_snapshot_tasks'] = data['periodic_snapshot_tasks'];
                }
            } else {
                payload['auto'] = false;
                if (payload['direction'] === 'PULL') {
                    payload['naming_schema'] = [this.defaultNamingSchema];
                } else {
                    payload['also_include_naming_schema'] = [this.defaultNamingSchema];
                }
            }

            if (data['retention_policy'] === 'CUSTOM') {
                payload['lifetime_value'] = data['lifetime_value'];
                payload['lifetime_unit'] = data['lifetime_unit'];
            }

            if (payload['transport'] === 'SSH+NETCAT') {
                payload['netcat_active_side'] = 'REMOTE'; // default?
            }
            
            return this.ws.call('replication.target_unmatched_snapshots', [
                payload['direction'],
                payload['source_datasets'],
                payload['target_dataset'],
                payload['transport'],
                payload['ssh_credentials'],
            ]).toPromise().then(
                (res) => {
                    let hasBadSnapshots = false;
                    for (const ds in res) {
                        if (res[ds].length > 0) {
                            hasBadSnapshots = true;
                            break;
                        }
                    }
                    if (hasBadSnapshots) {
                        return this.dialogService.confirm(
                            helptext.clearSnapshotDialog_title,
                            helptext.clearSnapshotDialog_content).toPromise().then(
                            (dialog_res) => {
                                payload['allow_from_scratch'] = dialog_res;
                                return this.ws.call(this.createCalls[item], [payload]).toPromise();
                            }
                        )
                    } else {
                        return this.ws.call(this.createCalls[item], [payload]).toPromise();
                    }
                },
                (err) => {
                    // show error ?
                    return this.ws.call(this.createCalls[item], [payload]).toPromise();
                }
            );
        }
    }

    async customSubmit(value) {
        this.loader.open();
        let toStop = false;

        const createdItems = {
            periodic_snapshot_tasks: null,
            snapshot: null,
            replication: null,
        }

        for (const item in createdItems) {
            if (!toStop) {
                if (!(item === 'periodic_snapshot_tasks' && (value['schedule_method'] !== 'cron' || value['source_datasets_from'] !== 'local')) &&
                !(item === 'snapshot' && (this.eligibleSnapshots > 0 || value['source_datasets_from'] !== 'local'))) {
                    await this.doCreate(value, item).then(
                        (res) => {
                            if (item === 'snapshot') {
                                createdItems[item] = res;
                            } else {
                                value[item] = res.id || res.map(snapshot => snapshot.id);
                                if (item === 'periodic_snapshot_tasks' && this.existSnapshotTasks.length !== 0) {
                                    value[item].push(...this.existSnapshotTasks);
                                }
                                createdItems[item] = res.id || res.map(snapshot => snapshot.id);
                            }
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

        if (value['schedule_method'] === 'once' && createdItems['replication'] != undefined) {
            await this.ws.call('replication.run', [createdItems['replication']]).toPromise().then(
                (res) => {
                    this.dialogService.Info(T('Task started'), T('Replication <i>') + value['name'] + T('</i> has started.'), '500px', 'info', true);
                }
            )
        }

        this.loader.close();
        if (!toStop) {
            this.router.navigate(new Array('/').concat(this.route_success));
        }
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

    createSSHConnection(activedField) {
        const self = this;

        const conf: DialogFormConfiguration = {
            title: T("Create SSH Connection"),
            fieldConfig: this.dialogFieldConfig,
            saveButtonText: T("Create SSH Connection"),
            customSubmit: async function (entityDialog) {
                const value = entityDialog.formValue;
                self.entityWizard.loader.open();

                if (value['private_key'] == 'NEW') {
                    await self.replicationService.genSSHKeypair().then(
                        (res) => {
                            value['sshkeypair'] = res;
                        },
                        (err) => {
                            new EntityUtils().handleWSError(this, err, this.dialogService);
                        }
                    )
                }
                if (value['setup_method'] == 'manual') {
                    await this.getRemoteHostKey(value).then(
                        (res) => {
                            value['remote_host_key'] = res;
                        },
                        (err) => {
                            new EntityUtils().handleWSError(this, err, this.dialogService);
                        }
                    )
                }

                const createdItems = {
                    private_key: null,
                    ssh_credentials: null,
                }
                let hasError = false;
                for (const item in createdItems) {
                    if (!((item === 'private_key' && value['private_key'] !== 'NEW'))) {
                        await self.doCreate(value, item).then(
                            (res) => {
                                value[item] = res.id;
                                createdItems[item] = res.id;
                                if (item === 'private_key') {
                                    const privateKeyField = _.find(self.dialogFieldConfig, { name: 'private_key' });
                                    privateKeyField.options.push({ label: res.name + ' (New Created)', value: res.id });
                                }
                                if (item === 'ssh_credentials') {
                                    const ssh_credentials_source_field = _.find(self.wizardConfig[0].fieldConfig, { 'name': 'ssh_credentials_source' });
                                    const ssh_credentials_target_field = _.find(self.wizardConfig[0].fieldConfig, { 'name': 'ssh_credentials_target' });
                                    ssh_credentials_source_field.options.push({ label: res.name + ' (New Created)', value: res.id });
                                    ssh_credentials_target_field.options.push({ label: res.name + ' (New Created)', value: res.id });
                                    self.entityWizard.formArray.controls[0].controls[activedField].setValue(res.id)
                                }
                            },
                            (err) => {
                                hasError = true;
                                self.rollBack(createdItems);
                                new EntityUtils().handleWSError(self, err, self.dialogService, self.dialogFieldConfig);
                            }
                        )
                    }
                }
                self.entityWizard.loader.close();
                if (!hasError) {
                    entityDialog.dialogRef.close(true);
                }
            }
        }
        this.dialogService.dialogForm(conf, true);
    }

    getRemoteHostKey(value) {
        const payload = {
            'host': value['host'],
            'port': value['port'],
        };
        return this.ws.call('keychaincredential.remote_ssh_host_key_scan', [payload]).toPromise();
    }

    genTaskName() {
        const source = this.entityWizard.formArray.controls[0].controls['source_datasets'].value || [];
        const target = this.entityWizard.formArray.controls[0].controls['target_dataset'].value;
        let suggestName = "";
        if (source.length > 3) {
            suggestName = source[0] + ',...,' + source[source.length - 1] + ' - ' + target;
        } else {
            suggestName = source.join(',') + ' - ' + target;
        }
        this.entityWizard.formArray.controls[0].controls['name'].setValue(suggestName);
    }

    getSnapshots() {
        const transport = this.entityWizard.formArray.controls[0].controls['transport'].enabled ? this.entityWizard.formArray.controls[0].controls['transport'].value : 'LOCAL';
        const payload = [
            this.entityWizard.formArray.controls[0].controls['source_datasets'].value || [],
            (this.entityWizard.formArray.controls[0].controls['naming_schema'].enabled && this.entityWizard.formArray.controls[0].controls['naming_schema'].value) ? this.entityWizard.formArray.controls[0].controls['naming_schema'].value.split(' ') : [this.defaultNamingSchema],
            transport,
            transport === 'LOCAL' ? null : this.entityWizard.formArray.controls[0].controls['ssh_credentials_source'].value,
        ];

        if (payload[0].length > 0) {
            this.ws.call('replication.count_eligible_manual_snapshots', payload).subscribe(
                (res) => {
                    this.eligibleSnapshots = res.eligible;
                    const isPush = this.entityWizard.formArray.controls[0].controls['source_datasets_from'].value === 'local';
                    let spanClass = 'info-paragraph';
                    let snapexpl = '';
                    if (res.eligible === 0) {
                        if (isPush) {
                            snapexpl = 'Snapshots will be created automatically.';
                        } else {
                            spanClass = 'warning-paragraph';
                        }
                    }
                    this.snapshotsCountField.paraText = `<span class="${spanClass}"><b>${res.eligible}</b> snapshots found. ${snapexpl}</span>`;
                },
                (err) => {
                    this.eligibleSnapshots = 0;
                    this.snapshotsCountField.paraText = '';
                    new EntityUtils().handleWSError(this, err);
                }
            )
        } else {
            this.eligibleSnapshots = 0;
            this.snapshotsCountField.paraText = '';
        }
    }

    async isSnapshotTaskExist(payload) {
        return this.ws.call('pool.snapshottask.query', [[
            ["dataset", "=", payload['dataset']],
            ["schedule.minute", "=", payload['schedule']['minute']],
            ["schedule.hour", "=", payload['schedule']['hour']],
            ["schedule.dom", "=", payload['schedule']['dom']],
            ["schedule.month", "=", payload['schedule']['month']],
            ["schedule.dow", "=", payload['schedule']['dow']]
        ]]).toPromise();
    }

}
