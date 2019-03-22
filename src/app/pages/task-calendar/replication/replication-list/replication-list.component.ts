import { Component } from '@angular/core';

@Component({
    selector: 'app-replication-list',
    template: `<entity-table [title]='title' [conf]='this'></entity-table>`
})
export class ReplicationListComponent {

    public title = "Replication Tasks";
    protected queryCall = 'replication.query';
    protected wsDelete = 'replication.delete';
    protected route_add: string[] = ["tasks", "replication", "add"];
    protected route_edit: string[] = ['tasks', 'replication', 'edit'];
    protected route_success: string[] = ['tasks', 'replication'];

    public columns: Array<any> = [
        { name: 'Direction', prop: 'direction' },
        { name: 'Transport', prop: 'transport' },
        { name: 'SSH Connection', prop: 'ssh_connection' },
        { name: 'Source Dataset', prop: 'source_datasets' },
        { name: 'Target Dataset', prop: 'target_dataset' },
        { name: 'Recursive', prop: 'recursive' },
        { name: 'Auto', prop: 'auto' },
        { name: 'Logging Level', prop: 'logging_level' },
        { name: 'Enabled', prop: 'enabled' },
        { name: 'State', prop: 'task_state' },
        { name: 'Last Snapshot', prop: 'name' },
    ];
    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        deleteMsg: {
            title: 'SSH Keypairs',
            key_props: ['source_datasets', 'ssh_connection', 'target_dataset']
        },
    };

    constructor() { }

    dataHandler(entityList) {
        for (let i = 0; i < entityList.rows.length; i++) {
            entityList.rows[i].task_state = entityList.rows[i].state.state;
            entityList.rows[i].ssh_connection = entityList.rows[i].ssh_credentials ? entityList.rows[i].ssh_credentials.name : '-';
        }
    }
}