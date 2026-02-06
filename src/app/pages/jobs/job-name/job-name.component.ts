import { DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, DestroyRef, input, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { filter } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { abortJobPressed } from 'app/modules/jobs/store/job.actions';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-job-name',
  templateUrl: './job-name.component.html',
  styleUrls: ['./job-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TnTooltipDirective,
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
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);

  readonly job = input.required<Job>();

  protected isRunning = computed(() => this.job().state === JobState.Running);

  protected readonly JobState = JobState;

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
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store$.dispatch(abortJobPressed({ job }));
      });
  }
}
