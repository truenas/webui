import { Component } from '@angular/core';

@Component({
    selector: 'app-api-keys',
    template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class ApiKeysComponent {
    public title = "API Keys";
    public queryCall = "apikeys.query";
    public wsDelete = "apikeys.delete";
    protected route_add_tooltip = "Add API Key";
    // protected wsDelete = "smart.test.delete";
    // public queryCall = "smart.test.query";

    public columns: Array<any> = [
        { name: 'Name', prop: 'name', always_display: true },
        { name: 'Created Date', prop: 'create_date' },
    ];

    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        deleteMsg: {
            title: 'APK Key',
        },
    };

}
