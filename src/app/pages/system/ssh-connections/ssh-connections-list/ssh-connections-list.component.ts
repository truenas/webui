import { Component } from '@angular/core';

@Component({
    selector: 'app-ssh-connections-list',
    template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class SShConnectionsListComponent {
    public title = "SSH Connections";
    protected queryCall = 'keychaincredential.query';
    protected queryCallOption = [[["type", "=", "SSH_CREDENTIALS"]]]

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