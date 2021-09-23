import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Observer } from 'rxjs';
import { filter } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { Job } from 'app/interfaces/job.interface';
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

  constructor(
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected storage: StorageService,
    protected http: HttpClient,
  ) {}

  getJobStatus(jobId: number): Observable<Job> {
    const source = Observable.create((observer: Observer<Job>) => {
      this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
        if (event.id == jobId) {
          observer.next(event.fields);
          if (event.fields.state === JobState.Success || event.fields.state === JobState.Failed) {
            observer.complete();
          }
        }
      });
    });
    return source;
  }

  showLogs(job: Job, title?: string, cancelMsg?: string): void {
    const dialog_title = title || T('Logs');
    const cancelButtonMsg = cancelMsg || T('Close');

    if (job.error) {
      if (job.logs_path) {
        this.dialog.errorReport(T('Error'), `<pre>${job.error}</pre>`, job.exception, job);
      } else {
        this.dialog.errorReport(T('Error'), `<pre>${job.error}</pre>`, job.exception);
      }
    } else {
      const log = job && job.logs_excerpt ? job.logs_excerpt : null;

      if (!log) {
        this.dialog.info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
      } else {
        const target_job = job;
        this.dialog.confirm({
          title: dialog_title,
          message: `<pre>${log}</pre>`,
          hideCheckBox: true,
          buttonMsg: T('Download Logs'),
          cancelMsg: cancelButtonMsg,
          disableClose: true,
        }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
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
        });
      }
    }
  }
}
