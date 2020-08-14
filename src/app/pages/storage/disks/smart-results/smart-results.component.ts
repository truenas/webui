import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
    selector: 'app-smart-test-results-list',
    template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class SmartResultsComponent {

    public title;
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
    constructor(private aroute: ActivatedRoute, protected translate: TranslateService,) { }
    preInit(entityForm: any) {
        this.aroute.params.subscribe(params => {
            this.disk = params['pk'];
            this.translate.get(T('S.M.A.R.T Test Results of ')).subscribe(
                (res) => {
                    this.title = res + this.disk;
                }
            );
            this.queryCallOption = [[["disk", "=", this.disk]]];
        });
    }

    resourceTransformIncomingRestData(data) {
        return data.tests || [];
    }
}
