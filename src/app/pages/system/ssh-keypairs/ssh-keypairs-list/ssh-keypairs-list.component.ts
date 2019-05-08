import { Component } from '@angular/core';

@Component({
    selector: 'app-ssh-keypairs-list',
    template: `<entity-table [title]='title' [conf]='this'></entity-table>`,
})
export class SshKeypairsListComponent {

    public title = "SSH Keypairs";
    protected queryCall = 'keychaincredential.query';
    protected queryCallOption = [[["type", "=", "SSH_KEY_PAIR"]]];
    protected wsDelete = 'keychaincredential.delete';
    protected route_add: string[] = ['system', 'sshkeypairs', 'add'];
    protected route_add_tooltip = "Add SSH Keypairs";
    protected route_edit: string[] = ['system', 'sshkeypairs', 'edit'];
    protected route_success: string[] = ['system', 'sshconnections'];

    public columns: Array<any> = [
        { name: 'Name', prop: 'name' },
    ];
    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        deleteMsg: {
            title: 'SSH Keypairs',
            key_props: ['name']
        },
    };
}