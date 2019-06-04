import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { T } from '../../../../translate-marker';
import { EntityUtils } from '../../../common/entity/utils';
import { WebSocketService, DialogService, SnackbarService } from '../../../../services';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-replication-list',
    template: `<entity-table [title]='title' [conf]='this'></entity-table>`,
    providers: [SnackbarService]
})
export class ReplicationListComponent {

    public title = "Replication Tasks";
    protected queryCall = 'replication.query';
    protected wsDelete = 'replication.delete';
    protected route_add: string[] = ["tasks", "replication", "wizard"];
    protected route_edit: string[] = ['tasks', 'replication', 'edit'];
    protected route_success: string[] = ['tasks', 'replication'];
    protected entityList: any;
    protected asyncView = true;

    public columns: Array<any> = [
        { name: 'Name', prop: 'name' },
        { name: 'Direction', prop: 'direction' },
        { name: 'Transport', prop: 'transport' },
        { name: 'SSH Connection', prop: 'ssh_connection' },
        { name: 'Source Dataset', prop: 'source_datasets' },
        { name: 'Target Dataset', prop: 'target_dataset' },
        { name: 'Recursive', prop: 'recursive' },
        { name: 'Auto', prop: 'auto' },
        { name: 'Enabled', prop: 'enabled' },
        { name: 'State', prop: 'task_state', state: 'state' },
        { name: 'Last Snapshot', prop: 'task_last_snapshot' },
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
        private translateService: TranslateService,
        private snackbarService: SnackbarService) { }

    afterInit(entityList: any) {
        this.entityList = entityList;
    }

    dataHandler(entityList) {
        for (let i = 0; i < entityList.rows.length; i++) {
            entityList.rows[i].task_state = entityList.rows[i].state.state;
            entityList.rows[i].task_last_snapshot = entityList.rows[i].state.last_snapshot;
            entityList.rows[i].ssh_connection = entityList.rows[i].ssh_credentials ? entityList.rows[i].ssh_credentials.name : '-';
        }
    }

    getActions(parentrow) {
        return [{
            id: "run",
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
            id: "edit",
            label: T("Edit"),
            onClick: (row) => {
                this.route_edit.push(row.id);
                this.router.navigate(this.route_edit);
            },
        }, {
            id: "delete",
            label: T("Delete"),
            onClick: (row) => {
                this.entityList.doDelete(row);
            },
        }]
    }

    stateButton(row) {
        if (row.state.error) {
            this.dialog.errorReport(row.state.state, row.state.error);
        }
    }
}