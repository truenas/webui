import { Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { JobsState } from 'app/modules/jobs/store/job.reducer';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';

@UntilDestroy()
@Component({
  templateUrl: './update-dialog.component.html',
  styleUrls: ['./update-dialog.component.scss'],
})
export class UpdateDialogComponent {
  selectRunningJobs$ = this.store$.select(selectUpdateJob);
  contentText: { message: string; title: string };

  constructor(private store$: Store<JobsState>) {}

  setMessage(confText: { message: string; title: string }): void {
    this.contentText = confText;
  }
}
