import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

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

  constructor(private aroute: ActivatedRoute, protected translate: TranslateService, private ws: WebSocketService, private dialogService: DialogService, private router: Router) { }

  preInit(entityList: EntityTableComponent) {
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

  callGetFunction(entityList: EntityTableComponent) {
    this.ws.call(this.queryCall, this.queryCallOption).subscribe((res) => {
      entityList.handleData(res);
    }, (err) => {
      entityList.setShowSpinner(false);
      entityList.toggleLoader(false);
      if (err.trace && err.trace.class === 'MatchNotFound') {
        this.dialogService.generalDialog({
          title: T('No Reults'),
          message: 'No test results were found',
          confirmBtnMsg: T('Back to disks'),
          hideCancel: true,
        }).subscribe((closed) => {
          if (closed) {
            this.router.navigate(['/storage/disks']);
          }
        });
      } else if (err.hasOwnProperty('reason') && (err.hasOwnProperty('trace') && err.hasOwnProperty('type'))) {
        this.dialogService.errorReport(err.type || err.trace.class, err.reason, err.trace.formatted);
      } else {
        new EntityUtils().handleError(this, err);
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    return data.tests || [];
  }
}
