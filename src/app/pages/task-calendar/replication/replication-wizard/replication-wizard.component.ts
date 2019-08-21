import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Validators, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';

import * as _ from 'lodash';

import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import helptext from '../../../../helptext/task-calendar/replication/replication-wizard';
import replicationHelptext from '../../../../helptext/task-calendar/replication/replication';
import sshConnectionsHelptex from '../../../../helptext/system/ssh-connections';
import snapshotHelptext from '../../../../helptext/task-calendar/snapshot/snapshot-form';

import { DialogService, KeychainCredentialService, WebSocketService, ReplicationService, TaskService, StorageService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

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
                },
                {
                    type: 'explorer',
                    name: 'source_datasets',
                    placeholder: helptext.source_datasets_placeholder,
                    tooltip: helptext.source_datasets_placeholder,
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
                        useTriState: true,
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
                    tooltip: helptext.target_dataset_placeholder,
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
                    value: true,
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
                    type: 'radio',
                    name: 'encryption',
                    placeholder: helptext.encryption_placeholder,
                    tooltip: helptext.encryption_tooltip,
                    options: [
                        {
                            label: 'Encryption (more secure, but slower)',
                            value: true,
                        },
                        {
                            label: 'No Encryption (less secure, but faster)',
                            value: false,
                        }
                    ],
                    value: true,
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
                    validation: [Validators.required],
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
                        value: 'corn',
                    }, {
                        label: 'Run Once',
                        value: 'once',
                    }],
                    class: 'inline',
                    width: '50%',
                },
                {
                    type: 'scheduler',
                    name: 'schedule',
                    placeholder: helptext.schedule_placeholder,
                    tooltip: helptext.schedule_tooltip,
                    class: 'inline',
                    width: '50%',
                    relation: [{
                        action: 'SHOW',
                        when: [{
                            name: 'schedule_method',
                            value: 'corn',
                        }]
                    }]
                },
                {
                    type: 'radio',
                    name: 'snapshot_lifetime',
                    placeholder: helptext.snapshot_lifetime_placeholder,
                    tooltip: helptext.snapshot_lifetime_tooltip,
                    options: [{
                        label: 'Same as Source',
                        value: 'same_as_source',
                    }, {
                        label: 'Never Delete',
                        value: 'never_delete',
                    }, {
                        label: 'Custom',
                        value: 'custom',
                    }],
                    class: 'inline',
                    width: '50%',
                },
                {
                    placeholder: helptext.lifetime_value_placeholder,
                    type: 'input',
                    name: 'lifetime_value',
                    inputType: 'number',
                    value: 2,
                    validation: [Validators.min(0)],
                    class: 'inline',
                    width: '25%',
                    relation: [{
                        action: 'SHOW',
                        when: [{
                            name: 'snapshot_lifetime',
                            value: 'custom',
                        }]
                    }]
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
                        when: [{
                            name: 'snapshot_lifetime',
                            value: 'custom',
                        }]
                    }]
                },
            ]
        }
    ];


    protected directions = ['PULL', 'PUSH'];
    protected selectedReplicationTask: any;

    constructor(private router: Router, private keychainCredentialService: KeychainCredentialService,
        private loader: AppLoaderService, private dialogService: DialogService,
        private ws: WebSocketService, private replicationService: ReplicationService,
        private taskService: TaskService, private storageService: StorageService,
        private datePipe: DatePipe, private entityFormService: EntityFormService) {

    }

    isCustActionVisible(id, stepperIndex) {
        if (stepperIndex == 0) {
            return true;
        }
        return false;
    }

    afterInit(entityWizard) {
        this.entityWizard = entityWizard;

        this.step0Init();
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
            if (value !== undefined && value !== '') {
                this.loadReplicationTask(value);
            } else {
                if (this.selectedReplicationTask !== undefined && this.selectedReplicationTask !== '') {
                    // reset form
                    this.clearReplicationTask();

                }
            }
            this.selectedReplicationTask = value;
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
                const explorerComponent = _.find(this.wizardConfig[0].fieldConfig, {name: datasetName}).customTemplateStringOptions.explorerComponent;
                if (explorerComponent) {
                    explorerComponent.nodes = [{
                        mountpoint: explorerComponent.config.initial,
                        name: explorerComponent.config.initial,
                        hasChildren: true
                    }];
                    this.entityWizard.formArray.controls[0].controls[datasetName].setValue('');
                }

                this.setDisable(datasetName, false, false, 0);
            });
        }

        this.entityWizard.formArray.controls[0].controls['recursive'].valueChanges.subscribe((value) => {
            const explorerComponent = _.find(this.wizardConfig[0].fieldConfig, {name: 'source_datasets'}).customTemplateStringOptions;
            if (explorerComponent) {
                explorerComponent.useTriState = value;
            }
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
        console.log(task);
        
    }

    clearReplicationTask() {
        console.log('clear replication task');
        
    }
}
