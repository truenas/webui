import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { SmartTestResults } from 'app/interfaces/smart-test.interface';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { PageTitleService } from 'app/services/page-title.service';

@UntilDestroy()
@Component({
  selector: 'app-smart-test-results-list',
  template: '<entity-table [conf]="this"></entity-table>',
})
export class SmartResultsComponent implements EntityTableConfig {
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
