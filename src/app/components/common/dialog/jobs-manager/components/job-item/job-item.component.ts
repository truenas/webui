import {
  Component, Input, Output, EventEmitter,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-job-item',
  templateUrl: './job-item.component.html',
  styleUrls: ['./job-item.component.scss'],
})
export class JobItemComponent {
  @Input() job: Job;
  @Output() aborted = new EventEmitter();
  readonly JobState = JobState;

  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {}

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
        this.aborted.emit();
      });
  }
}
