import { DecimalPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, input, computed,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { abortJobPressed } from 'app/modules/jobs/store/job.actions';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-job-name',
  templateUrl: './job-name.component.html',
  styleUrls: ['./job-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    MatTooltip,
    MatProgressSpinner,
    MatProgressBar,
    MatIconButton,
    TestDirective,
    TranslateModule,
    DecimalPipe,
  ],
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
