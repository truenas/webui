import {
  Component, ChangeDetectionStrategy, input, computed,
} from '@angular/core';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { abortJobPressed } from 'app/modules/jobs/store/job.actions';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-job-name',
  templateUrl: './job-name.component.html',
  styleUrls: ['./job-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobNameComponent {
  readonly job = input.required<Job>();

  protected isRunning = computed(() => this.job().state === JobState.Running);

  protected readonly JobState = JobState;

  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
    private store$: Store<AppState>,
  ) {}

  onAborted(): void {
    const job = this.job();
    this.dialogService
      .confirm({
        title: this.translate.instant('Abort'),
        message: this.translate.instant('Are you sure you want to abort the <b>{task}</b> task?', { task: job.method }),
        hideCheckbox: true,
        buttonText: this.translate.instant('Abort'),
        cancelText: this.translate.instant('Cancel'),
        disableClose: true,
      })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.store$.dispatch(abortJobPressed({ job }));
      });
  }
}
