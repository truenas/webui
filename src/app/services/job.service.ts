import { Injectable } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, Observable, Observer } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { Job } from 'app/interfaces/job.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService } from './dialog.service';
import { StorageService } from './storage.service';
import { WebSocketService } from './ws.service';

@UntilDestroy()
@Injectable()
export class JobService {
  constructor(
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected storage: StorageService,
  ) {}

  getJobStatus(jobId: number): Observable<Job> {
    return new Observable((observer: Observer<Job>) => {
      this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
        if (event.id === jobId) {
          observer.next(event.fields);
          if (event.fields.state === JobState.Success || event.fields.state === JobState.Failed) {
            observer.complete();
          }
        }
      });
    });
  }

  showLogs(job: Job, title?: string, cancelMsg?: string): void {
    const dialogTitle = title || T('Logs');
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
        this.dialog.warn(globalHelptext.noLogDialog.title, globalHelptext.noLogDialog.message);
      } else {
        const targetJob = job;
        this.dialog.confirm({
          title: dialogTitle,
          message: `<pre>${log}</pre>`,
          hideCheckBox: true,
          buttonMsg: T('Download Logs'),
          cancelMsg: cancelButtonMsg,
          disableClose: true,
        }).pipe(
          filter(Boolean),
          switchMap(() => this.ws.call('core.download', ['filesystem.get', [targetJob.logs_path], `${targetJob.id}.log`])),
          switchMap(([, url]) => this.storage.downloadUrl(url, `${targetJob.id}.log`, 'text/plain')),
          catchError((error) => {
            new EntityUtils().handleWsError(this, error);
            return EMPTY;
          }),
          untilDestroyed(this),
        ).subscribe();
      }
    }
  }
}
