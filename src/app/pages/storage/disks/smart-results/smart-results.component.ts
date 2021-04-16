import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService } from 'app/services';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-smart-test-results-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class SmartResultsComponent {
  title;
  protected queryCall = 'smart.test.results';
  protected queryCallOption = [];

  columns: any[] = [
    { name: T('ID'), prop: 'num', always_display: true },
    { name: T('Description'), prop: 'description' },
    { name: T('Status'), prop: 'status' },
    { name: T('Remaining'), prop: 'remaining', hidden: true },
    { name: T('Lifetime'), prop: 'lifetime', hidden: true },
    { name: T('Error'), prop: 'lba_of_first_error', hidden: true },
  ];
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };
  protected noActions = true;
  protected disk: string;

  constructor(private aroute: ActivatedRoute, protected translate: TranslateService) { }

  preInit(entityList: any) {
    this.aroute.params.subscribe((params) => {
      this.disk = params['pk'];
      this.translate.get(T('S.M.A.R.T Test Results of ')).subscribe(
        (res) => {
          this.title = res + this.disk;
        },
      );
      this.queryCallOption = [[['disk', '=', this.disk]], { get: true }];
    });
  }

  callGetFunction(entityList) {
    entityList.ws.call(this.queryCall, this.queryCallOption).subscribe((res) => {
      entityList.conf.handleData(res);
    }, (err) => {
      if (entityList.showSpinner) {
        entityList.showSpinner = false;
      }
      if (entityList.loaderOpen) {
        entityList.conf.loader.close();
        entityList.conf.loaderOpen = false;
      }
      if (err.trace && err.trace.class === 'MatchNotFound') {
        entityList.dialogService.generalDialog({
          title: T('No test results were found'),
          confirmBtnMsg: T('Back to disks'),
          hideCancel: true,
        }).subscribe((closed) => {
          if (closed) {
            entityList.router.navigate(['/storage/disks']);
          }
        });
      } else if (err.hasOwnProperty('reason') && (err.hasOwnProperty('trace') && err.hasOwnProperty('type'))) {
        entityList.dialogService.errorReport(err.type || err.trace.class, err.reason, err.trace.formatted);
      } else {
        new EntityUtils().handleError(this, err);
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    return data.tests || [];
  }
}
