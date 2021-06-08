import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { EntityJobState } from 'app/enums/entity-job-state.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';
import { DialogService } from './dialog.service';
import { StorageService } from './storage.service';
import { WebSocketService } from './ws.service';

@UntilDestroy()
@Injectable()
export class JobService {
  protected accountUserResource = 'account/users/';
  protected accountGroupResource = 'account/groups/';
  protected accountAllUsersResource = 'account/all_users/';
  protected accountAllGroupsResource = 'account/all_groups/';

  constructor(protected ws: WebSocketService, protected dialog: DialogService, protected storage: StorageService, protected http: HttpClient) {}

  getJobStatus(jobId: any): Observable<any> {
    const source = Observable.create((observer: any) => {
      this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((res) => {
        if (res.id == jobId) {
          observer.next(res.fields);
          if (res.fields.state === EntityJobState.Success || res.fields.state === EntityJobState.Failed) {
            observer.complete();
          }
        }
      });
    });
    return source;
  }

  showLogs(job: any, title?: string, cancelMsg?: string): void {
    let dialog_title; let
      cancelButtonMsg;
    title ? dialog_title = title : dialog_title = T('Logs');
    cancelMsg ? cancelButtonMsg = cancelMsg : cancelButtonMsg = T('Close');

    if (job.error) {
      if (job.logs_path) {
        this.dialog.errorReport(T('Error'), `<pre>${job.error}</pre>`, job.exception, job);
      } else {
        this.dialog.errorReport(T('Error'), `<pre>${job.error}</pre>`, job.exception);
      }
    } else {
      const log = job && job.logs_excerpt ? job.logs_excerpt : null;

      if (!log) {
        this.dialog.Info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
      } else {
        const target_job = job;
        this.dialog.confirm(dialog_title, `<pre>${log}</pre>`, true, T('Download Logs'),
          false, '', '', '', '', false, cancelButtonMsg, true).pipe(untilDestroyed(this)).subscribe(
          (dialog_res: boolean) => {
            if (dialog_res) {
              this.ws.call('core.download', ['filesystem.get', [target_job.logs_path], target_job.id + '.log']).pipe(untilDestroyed(this)).subscribe(
                (snack_res) => {
                  const url = snack_res[1];
                  const mimetype = 'text/plain';
                  this.storage.streamDownloadFile(this.http, url, target_job.id + '.log', mimetype).pipe(untilDestroyed(this)).subscribe(
                    (file) => {
                      this.storage.downloadBlob(file, target_job.id + '.log');
                    },
                    (err) => {
                      new EntityUtils().handleWSError(this, err);
                    },
                  );
                },
                (snack_res) => {
                  new EntityUtils().handleWSError(this, snack_res);
                },
              );
            }
          },
        );
      }
    }
  }
}
