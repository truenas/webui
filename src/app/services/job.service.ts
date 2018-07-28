import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs/Rx';

import { EntityUtils } from '../pages/common/entity/utils'
import { WebSocketService } from './ws.service';
import { DialogService } from './dialog.service';
import { T } from '../translate-marker';

@Injectable()
export class JobService {
  protected accountUserResource: string = 'account/users/';
  protected accountGroupResource: string = 'account/groups/';
  protected accountAllUsersResource: string = 'account/all_users/';
  protected accountAllGroupsResource: string = 'account/all_groups/';

  constructor(protected ws: WebSocketService, protected dialog: DialogService) {};

  getJobStatus(job_id): Observable<any> {
    let source = Observable.create((observer) => {
      this.ws.subscribe("core.get_jobs").subscribe((res) => {
        if (res.id == job_id) {
          observer.next(res.fields);
          if (res.fields.state == 'SUCCESS' || res.fields.state == 'FAILED') {
            observer.complete();
          }
        }
      });
    });
    return source;
  }

  showLogs(job_id) {
    this.ws.call("core.get_jobs").subscribe((res) => {
      for(var i = 0; i < res.length; i++) {
        if (res[i].id == job_id) {
          if (res[i].logs_path && res[i].logs_excerpt) {
            this.dialog.confirm(T('Logs'), res[i].logs_excerpt, true, T('Download Logs')).subscribe(
              (res) => {
                console.log(res);
              });
          }
        }
      }
    });
  }
}
