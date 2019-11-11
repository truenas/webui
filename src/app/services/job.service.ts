import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs/Rx';
import { Http } from '@angular/http';

import { EntityUtils } from '../pages/common/entity/utils'
import { WebSocketService } from './ws.service';
import { DialogService } from './dialog.service';
import { StorageService } from './storage.service';
import { T } from '../translate-marker';

@Injectable()
export class JobService {
  protected accountUserResource: string = 'account/users/';
  protected accountGroupResource: string = 'account/groups/';
  protected accountAllUsersResource: string = 'account/all_users/';
  protected accountAllGroupsResource: string = 'account/all_groups/';

  constructor(protected ws: WebSocketService, protected dialog: DialogService, protected storage: StorageService, protected http: Http) {};

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
      for(let i = 0; i < res.length; i++) {
        if (res[i].id === job_id) {
          if (res[i].logs_path && res[i].logs_excerpt) {
            const target_job = res[i];
            this.dialog.confirm(dialog_title, `<pre>${res[i].logs_excerpt}</pre>`, true, T('Download Logs'),
              false, '', '', '', '', false, cancelButtonMsg, true).subscribe(
              (dialog_res) => {
                if (dialog_res) {
                  this.ws.call('core.download', ['filesystem.get', [target_job.logs_path], target_job.id + '.log']).subscribe(
                    (snack_res) => {
                      const url = snack_res[1];
                      const mimetype = 'text/plain';
                      let failed = false;
                      this.storage.streamDownloadFile(this.http, url, target_job.id + '.log', mimetype).subscribe(file => {
                        this.storage.downloadBlob(file, target_job.id + '.log');
                      }, err => {
                        failed = true;
                        new EntityUtils().handleWSError(this, err);
                      });
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
