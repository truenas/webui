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