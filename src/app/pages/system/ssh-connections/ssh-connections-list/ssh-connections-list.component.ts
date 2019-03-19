import { Component } from '@angular/core';

@Component({
    selector: 'app-ssh-connections-list',
    template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class SshConnectionsListComponent {
    public title = "SSH Connections";
    protected queryCall = 'keychaincredential.query';
    protected queryCallOption = [[["type", "=", "SSH_CREDENTIALS"]]]
    protected route_add: string[] = ['system', 'sshconnections', 'add'];
    protected route_add_tooltip = "Add SSH Connection";
    protected route_edit: string[] = ['system', 'sshconnections', 'edit'];
    protected route_delete: string[] = ['system', 'sshconnections', 'delete'];
    protected route_success: string[] = ['system', 'sshconnections'];

    public columns: Array<any> = [
        { name: 'Name', prop: 'name' },
    ];
    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        deleteMsg: {
            title: 'SSH Connections',
            key_props: ['name']
        },
    };
}