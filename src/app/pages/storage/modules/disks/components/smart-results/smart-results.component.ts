import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { SmartTestResults } from 'app/interfaces/smart-test.interface';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { PageTitleService } from 'app/services/page-title.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [conf]="this"></ix-entity-table>',
})
export class SmartResultsComponent implements EntityTableConfig {
  title = 'SMART test results';
  queryCall = 'smart.test.results' as const;
  queryCallOption: QueryParams<SmartTestResults> = [];

  emptyTableConfigMessages = {
    no_page_data: {
      title: this.translate.instant('No SMART test results'),
      message: this.translate.instant('No SMART tests have been performed on this disk yet.'),
    },
  };

  columns = [
    { name: this.translate.instant('ID'), prop: 'num', always_display: true },
    { name: this.translate.instant('Description'), prop: 'description' },
    { name: this.translate.instant('Status'), prop: 'status' },
    { name: this.translate.instant('Remaining'), prop: 'remaining', hidden: true },
    { name: this.translate.instant('Lifetime'), prop: 'lifetime', hidden: true },
    { name: this.translate.instant('Error'), prop: 'lba_of_first_error', hidden: true },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
  };
  noActions = true;
  noAdd = true;

  protected disk: string;

  constructor(
    private aroute: ActivatedRoute,
    private translate: TranslateService,
    private pageTitleService: PageTitleService,
  ) { }

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.disk = params['pk'];
      const pageTitle = this.translate.instant('S.M.A.R.T Test Results of {disk}', {
        disk: this.disk,
      });
      this.pageTitleService.setTitle(pageTitle);
      this.queryCallOption = [[['disk', '=', this.disk]]];
    });
  }

  resourceTransformIncomingRestData(data: SmartTestResults[]): SmartTestResults['tests'] {
    return data[0]?.tests || [];
  }
}
