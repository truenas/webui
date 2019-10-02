import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs/Rx';

import { EntityUtils } from '../pages/common/entity/utils'
import { WebSocketService } from './ws.service';
import { DialogService } from './dialog.service';
import { T } from '../translate-marker';
import { MatSnackBar } from '@angular/material';

@Injectable()
export class JobService {
  protected accountUserResource: string = 'account/users/';
  protected accountGroupResource: string = 'account/groups/';
  protected accountAllUsersResource: string = 'account/all_users/';
  protected accountAllGroupsResource: string = 'account/all_groups/';

  constructor(protected ws: WebSocketService, protected dialog: DialogService, protected snackBar: MatSnackBar) {};

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

  showLogs(job_id, title?, cancelMsg?) {
    let dialog_title, cancelButtonMsg;
    title ? dialog_title = title : dialog_title = T("Logs");
    cancelMsg ? cancelButtonMsg = cancelMsg : cancelButtonMsg = T('Cancel');
    this.ws.call("core.get_jobs").subscribe((res) => {
      for(var i = 0; i < res.length; i++) {
        if (res[i].id == job_id) {
          if (res[i].logs_path && res[i].logs_excerpt) {
            let target_job = res[i];
            this.dialog.confirm(dialog_title, `<pre>${res[i].logs_excerpt}</pre>`, true, T('Download Logs'),
              false, '', '', '', '', false, cancelButtonMsg).subscribe(
              (dialog_res) => {
                if (dialog_res) {
                  this.ws.call('core.download', ['filesystem.get', [target_job.logs_path], target_job.id + '.log']).subscribe(
                    (snack_res) => {
                      this.snackBar.open(T("Redirecting to download. Make sure pop-ups are enabled in the browser."), T("Success"), {
                        duration: 5000
                      });
                      window.open(snack_res[1]);
                    },
                    (snack_res) => {
                      new EntityUtils().handleWSError(this, snack_res);
                    }
                  );
                }
              });
          } else if (res[i].logs_path) {
            this.dialog.errorReport(T('Error'), res[i].error, res[i].exception, res[i]);
          } else if (res[i].error) {
            this.dialog.errorReport(T('Error'), res[i].error, res[i].exception);
          } 
        }
      }
    });
  }
}
