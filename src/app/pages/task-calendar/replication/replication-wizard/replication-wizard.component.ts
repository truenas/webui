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
                }
                // {
                //     type: 'input',
                //     name: 'name', //for new ssh connection and new snapshot task and replication
                //     placeholder: helptext.name_placeholder,
                //     tooltip: helptext.name_tooltip,
                //     required: true,
                //     validation: [Validators.required],
                //     parent: this
                // },
            ]
        },
        {
            label: helptext.step2_label,
            fieldConfig: [
                
            ]
        }
    ];

    constructor(private router: Router, private keychainCredentialService: KeychainCredentialService,
        private loader: AppLoaderService, private dialogService: DialogService,
        private ws: WebSocketService, private replicationService: ReplicationService,
        private taskService: TaskService, private storageService: StorageService,
        private datePipe: DatePipe) {
            const exist_replicationField = _.find(this.wizardConfig[0].fieldConfig, {name: 'exist_replication'});
            this.replicationService.getReplicationTasks().subscribe(
                (res) => {
                    for (const task of res) {
                        const lable = task.name + ((task.state && task.state.datetime) ? '(last run ' + this.datePipe.transform(new Date(task.state.datetime.$date), 'MM/dd/yyyy') + ')' : '');
                        exist_replicationField.options.push({label: lable, value: task.id});
                    }
                } 
            )
        }

    isCustActionVisible(id, stepperIndex) {
        if (stepperIndex == 0) {
            return true;
        }
        return false;
    }


}
