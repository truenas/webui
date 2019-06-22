import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { DialogService, JobService, SnackbarService, WebSocketService } from '../../../../services';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../../../common/entity/utils';
import { ReplicationDetailsComponent } from './components/replication-details.component';

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
    public showActions = false;
    protected hasDetails = true;
    protected rowDetailComponent = ReplicationDetailsComponent;
    protected asyncView = true;

    public columns: Array<any> = [
        { name: 'Name', prop: 'name' },
        { name: 'Source Dataset', prop: 'source_datasets', hidden: true},
        { name: 'Target Dataset', prop: 'target_dataset', hidden: true},
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
        public router: Router,
        public ws: WebSocketService,
        public dialog: DialogService,
        public snackbarService: SnackbarService,
        protected job: JobService) { }

    afterInit(entityList: any) {
        this.entityList = entityList;
    }

    dataHandler(entityList) {
        for (const task of entityList.rows) {
            task.task_state = task.state.state;
            task.ssh_connection = task.ssh_credentials ? task.ssh_credentials.name : '-';
            if (task.state.job && task.state.job.time_finished) {
                task.task_last_snapshot = moment(task.state.job.time_finished.$date).format('MM/D/YYYY h:mma');
            }
            console.log({ task })
        }
    }

    stateButton(row) {
        if (row.state.error) {
            this.dialog.errorReport(row.state.state, row.state.error);
        } else if (row.state.job) {
            this.job.showLogs(row.state.job.id);
        }
    }
}
