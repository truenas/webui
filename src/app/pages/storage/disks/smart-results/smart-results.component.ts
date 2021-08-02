import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { SmartTestResults } from 'app/interfaces/smart-test.interface';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-smart-test-results-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class SmartResultsComponent implements EntityTableConfig {
  title: string;
  queryCall: 'smart.test.results' = 'smart.test.results';
  queryCallOption: QueryParams<SmartTestResults> = [];

  emptyTableConfigMessages = {
    no_page_data: {
      title: this.translate.instant('No SMART test results'),
      message: this.translate.instant('No SMART tests have been performed on this disk yet.'),
    },
  };

  columns = [
    { name: T('ID'), prop: 'num', always_display: true },
    { name: T('Description'), prop: 'description' },
    { name: T('Status'), prop: 'status' },
    { name: T('Remaining'), prop: 'remaining', hidden: true },
    { name: T('Lifetime'), prop: 'lifetime', hidden: true },
    { name: T('Error'), prop: 'lba_of_first_error', hidden: true },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
  };
  noActions = true;
  noAdd = true;

  protected disk: string;

  constructor(private aroute: ActivatedRoute, private translate: TranslateService) { }

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.disk = params['pk'];
      this.title = this.translate.instant('S.M.A.R.T Test Results of {disk}', {
        disk: this.disk,
      });
      this.queryCallOption = [[['disk', '=', this.disk]]];
    });
  }

  resourceTransformIncomingRestData(data: SmartTestResults[]): SmartTestResults['tests'] {
    return data[0]?.tests || [];
  }
}
