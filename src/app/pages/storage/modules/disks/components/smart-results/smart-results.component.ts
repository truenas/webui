import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom, map, tap } from 'rxjs';
import { SmartTestResultPageType } from 'app/enums/smart-test-results-page-type.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { SmartTestResult, SmartTestResults } from 'app/interfaces/smart-test.interface';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { PageTitleService } from 'app/services/page-title.service';
import { WebSocketService } from 'app/services/ws.service';

interface SmartTestResultsRow extends SmartTestResult {
  disk: string;
  id: number;
}

@UntilDestroy()
@Component({
  template: '<ix-entity-table [conf]="this"></ix-entity-table>',
})
export class SmartResultsComponent implements EntityTableConfig {
  title = 'S.M.A.R.T. test results';
  queryCall = 'smart.test.results' as const;
  queryCallOption: QueryParams<SmartTestResults> = [];

  emptyTableConfigMessages = {
    first_use: {
      title: this.translate.instant('No S.M.A.R.T. test results'),
      message: this.translate.instant('No S.M.A.R.T. tests have been performed on this disk yet.'),
    },
    no_page_data: {
      title: this.translate.instant('No S.M.A.R.T. test results'),
      message: this.translate.instant('No S.M.A.R.T. tests have been performed on this disk yet.'),
    },
  };

  columns = [
    { name: this.translate.instant('ID'), prop: 'id', always_display: true },
    { name: this.translate.instant('Disk'), prop: 'disk', always_display: true },
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

  protected pk: string;
  protected type: SmartTestResultPageType;

  constructor(
    private aroute: ActivatedRoute,
    private translate: TranslateService,
    private pageTitleService: PageTitleService,
    private ws: WebSocketService,
  ) { }

  prerequisite(): Promise<boolean> {
    return lastValueFrom(
      this.ws.call('disk.query', [[], { extra: { pools: true } }]).pipe(
        tap((disks) => {
          this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
            this.pk = params.pk as string;
            this.type = params.type as SmartTestResultPageType;

            if (this.type === SmartTestResultPageType.Disk) {
              this.queryCallOption = [[['disk', '=', this.pk]]];
              this.pageTitleService.setTitle(this.translate.instant('S.M.A.R.T. Test Results of {pk}', { pk: this.pk }));
            } else if (this.type === SmartTestResultPageType.Pool) {
              const disksNames = disks.filter((disk) => disk.pool === this.pk).map((disk) => disk.name);
              this.queryCallOption = [[['disk', 'in', disksNames]]];
              this.pageTitleService.setTitle(this.translate.instant('S.M.A.R.T. Test Results of {pk}', { pk: this.pk }));
            } else {
              this.pageTitleService.setTitle(this.translate.instant('S.M.A.R.T. Test Results'));
            }
          });
        }),
        map(() => true),
      ),
    );
  }

  resourceTransformIncomingRestData(data: SmartTestResults[]): SmartTestResultsRow[] {
    const rows: SmartTestResultsRow[] = [];
    data.forEach((item) => {
      item?.tests.forEach((test) => {
        rows.push({ ...test, disk: item.disk, id: test.num });
      });
    });
    return rows;
  }
}
