import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { T } from '../../../../translate-marker';

@Component({
    selector: 'app-smart-test-results-list',
    template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class SmartResultsComponent {

    public title = T("S.M.A.R.T Test Results");
    protected queryCall = "smart.test.results";
    protected queryCallOption = [];

    public columns: Array<any> = [
        { name: T('ID'), prop: 'num', always_display: true },
        { name: T('Description'), prop: "description" },
        { name: T('Status'), prop: 'status' },
        { name: T('Remaining'), prop: 'remaining', hidden: true },
        { name: T('Lifetime'), prop: 'lifetime', hidden: true },
        { name: T('Error'), prop: 'lba_of_first_error', hidden: true },
    ];
    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
    };
    protected noActions = true;

    protected disk;
    constructor(private aroute: ActivatedRoute) { }
    preInit(entityForm: any) {
        this.aroute.params.subscribe(params => {
            this.disk = params['pk'];
            this.queryCallOption = [[["disk", "=", this.disk]], { "get": true }];
        });
    }

    resourceTransformIncomingRestData(data) {
        return data.tests;
    }
}
