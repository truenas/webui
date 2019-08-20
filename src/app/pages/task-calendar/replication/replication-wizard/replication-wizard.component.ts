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
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

@Component({
    selector: 'app-replication-wizard',
    template: `<entity-wizard [conf]="this"></entity-wizard>`,
    providers: [KeychainCredentialService, ReplicationService, TaskService, DatePipe]
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
                    type: 'select',
                    name: 'exist_replication',
                    placeholder: helptext.exist_replication_placeholder,
                    tooltip: helptext.exist_replication_tooltip,
                    options: [],
                },
                {
                    type: 'select',
                    name: 'source_datasets_from',
                    placeholder: helptext.source_datasets_placeholder,
                    tooltip: helptext.source_datasets_tooltip,
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
                    name: 'target_datasets_from',
                    placeholder: helptext.target_dataset_placeholder,
                    tooltip: helptext.target_dataset_tooltip,
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
                    placeholder: helptext.ssh_credentials_placeholder,
                    tooltip: helptext.ssh_credentials_tooltip,
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
                    placeholder: helptext.ssh_credentials_placeholder,
                    tooltip: helptext.ssh_credentials_tooltip,
                    options: [],
                    class: 'inline',
                    width: '50%',
                    relation: [{
                        action: 'SHOW',
                        when: [{
                            name: 'target_datasets_from',
                            value: 'remote',
                        }]
                    }],
                    isHidden: true,
                },
                {
                    type: 'explorer',
                    name: 'source_datasets',
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
                    class: 'inline',
                    width: '50%',
                },
                {
                    type: 'explorer',
                    name: 'target_dataset',
                    placeholder: replicationHelptext.target_dataset_placeholder,
                    tooltip: replicationHelptext.target_dataset_placeholder,
                    initial: '',
                    explorerType: 'directory',
                    // customTemplateStringOptions: {
                    //     displayField: 'Path',
                    //     isExpandedField: 'expanded',
                    //     idField: 'uuid',
                    //     getChildren: this.getChildren.bind(this),
                    //     nodeHeight: 23,
                    //     allowDrag: false,
                    //     useVirtualScroll: false,
                    // },
                    required: true,
                    validation: [Validators.required],
                    isHidden: true,
                    class: 'inline',
                    width: '50%',
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

            ]
        }
    ];

    protected entityWizard: any;

    constructor(private router: Router, private keychainCredentialService: KeychainCredentialService,
        private loader: AppLoaderService, private dialogService: DialogService,
        private ws: WebSocketService, private replicationService: ReplicationService,
        private taskService: TaskService, private storageService: StorageService,
        private datePipe: DatePipe) {

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
                    exist_replicationField.options.push({ label: lable, value: task.id });
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
    }

    getChildren(node) {
        const sshCredentials = this.entityWizard.formArray.controls[0].controls['ssh_credentials_source'].value;
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
