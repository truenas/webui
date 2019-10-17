import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';
import * as moment from 'moment';
import { DialogService, JobService, SnackbarService, WebSocketService } from '../../../../services';

@Component({
    selector: 'app-replication-list',
    template: `<entity-table [title]='title' [conf]='this'></entity-table>`,
    providers: [SnackbarService, JobService]
})
export class ReplicationListComponent {

    public title = "Replication Tasks";
    protected queryCall = 'replication.query';
    protected wsDelete = 'replication.delete';
    protected route_add: string[] = ["tasks", "replication", "wizard"];
    protected route_edit: string[] = ['tasks', 'replication', 'edit'];
    protected route_success: string[] = ['tasks', 'replication'];
    public entityList: any;
    protected asyncView = true;

    public columns: Array<any> = [
        { name: 'Name', prop: 'name', always_display: true },
        { name: 'Direction', prop: 'direction'},
        { name: 'Transport', prop: 'transport', hidden: true},
        { name: 'SSH Connection', prop: 'ssh_connection', hidden: true},
        { name: 'Source Dataset', prop: 'source_datasets', hidden: true},
        { name: 'Target Dataset', prop: 'target_dataset', hidden: true},
        { name: 'Recursive', prop: 'recursive', hidden: true},
        { name: 'Auto', prop: 'auto', hidden: true},
        { name: 'Enabled', prop: 'enabled', hidden: true },
        { name: 'State', prop: 'task_state', state: 'state' },
        { name: 'Last Snapshot', prop: 'task_last_snapshot' }
    ];

    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        deleteMsg: {
            title: 'Replication Task',
            key_props: ['name']
        },
    };

    constructor(
        private router: Router,
        private ws: WebSocketService,
        private dialog: DialogService,
        private snackbarService: SnackbarService,
        protected job: JobService) { }

    afterInit(entityList: any) {
        this.entityList = entityList;
    }

    resourceTransformIncomingRestData(tasks: any[]): any[] {
        return tasks.map(task => {
            task.task_state = task.state.state;
            task.ssh_connection = task.ssh_credentials ? task.ssh_credentials.name : '-';
            task.task_last_snapshot = task.state.last_snapshot ? task.state.last_snapshot : T('No snapshots sent yet');
            return task;
        });
    }

    getActions(parentrow) {
        return [{
            id: parentrow.name,
            icon: 'play_arrow',
            name: "run",
            label: T("Run Now"),
            onClick: (row) => {
                this.dialog.confirm(T("Run Now"), T("Replicate <i>") + row.name + T("</i> now?"), true).subscribe((res) => {
                    if (res) {
                        row.state = 'RUNNING';
                        this.ws.call('replication.run', [row.id]).subscribe(
                            (res) => {
                                this.snackbarService.open(T('Replication <i>') + row.name + T('</i> has started.'), T('close'), { duration: 5000 });
                            },
                            (err) => {
                                new EntityUtils().handleWSError(this.entityList, err);
                            })
                    }
                });
            },
        }, {
            id: parentrow.name,
            icon: 'edit',
            name: "edit",
            label: T("Edit"),
            onClick: (row) => {
                this.route_edit.push(row.id);
                this.router.navigate(this.route_edit);
            },
        }, {
            id: parentrow.name,
            icon: 'delete',
            name: "delete",
            label: T("Delete"),
            onClick: (row) => {
                this.entityList.doDelete(row);
            },
        }]
    }

    stateButton(row) {
        if (row.state.error) {
            this.dialog.confirm(row.state.state,row.state.error,true, T('VIEW LOGS')).subscribe(
                (res) => {
                    if (res) {
                        this.job.showLogs(row.state.job.id);
                    }
                })
        } else if (row.state.job) {
            this.job.showLogs(row.state.job.id);
        }
    }
}