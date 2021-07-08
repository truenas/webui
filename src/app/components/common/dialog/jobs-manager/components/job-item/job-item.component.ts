import {
  Component, ChangeDetectionStrategy, Input, Output, EventEmitter,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { WebSocketService } from 'app/services/ws.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-job-item',
  templateUrl: './job-item.component.html',
  styleUrls: ['./job-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobItemComponent {
  @Input() job: Job;
  @Output() aborted = new EventEmitter();
  readonly JobState = JobState;

  constructor(
    private ws: WebSocketService,
    private localeService: LocaleService,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {}

  getReadableDate(input: ApiTimestamp): string {
    return this.localeService.formatDateTime(new Date(input.$date));
  }

  abort(job: Job): void {
    this.dialogService
      .confirm({
        title: this.translate.instant(T('Abort the task')),
        message: `<pre>${job.method}</pre>`,
        hideCheckBox: true,
        buttonMsg: this.translate.instant(T('Abort')),
        cancelMsg: this.translate.instant(T('Close')),
        disableClose: true,
      })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.ws
          .call('core.job_abort', [job.id])
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.aborted.emit();
          });
      });
  }
}
