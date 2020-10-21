import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { EntityUtils } from '../pages/common/entity/utils'
import { WebSocketService } from './ws.service';
import { DialogService } from './dialog.service';
import { StorageService } from './storage.service';
import { T } from '../translate-marker';
import globalHelptext from '../helptext/global-helptext';

@Injectable()
export class JobService {
  protected accountUserResource: string = 'account/users/';
  protected accountGroupResource: string = 'account/groups/';
  protected accountAllUsersResource: string = 'account/all_users/';
  protected accountAllGroupsResource: string = 'account/all_groups/';

  constructor(protected ws: WebSocketService, protected dialog: DialogService, protected storage: StorageService, protected http: HttpClient) {};

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

  showLogs(job, title?, cancelMsg?) {
    let dialog_title, cancelButtonMsg;
    title ? dialog_title = title : dialog_title = T("Logs");
    cancelMsg ? cancelButtonMsg = cancelMsg : cancelButtonMsg = T('Close');

    if (job.error) {
      if (job.logs_path) {
        this.dialog.errorReport(T('Error'), job.error, job.exception, job);
      } else {
        this.dialog.errorReport(T('Error'), job.error, job.exception);
      }
    } else {
      if (job.logs_excerpt === '') {
        this.dialog.Info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
      } else {
        const target_job = job;
        this.dialog.confirm(dialog_title, `<pre>${job.logs_excerpt}</pre>`, true, T('Download Logs'),
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
      }
    }
  }
}
