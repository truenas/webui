import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { JobsState } from 'app/modules/jobs/store/job.reducer';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-update-dialog',
  templateUrl: './update-dialog.component.html',
  styleUrls: ['./update-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogTitle,
    TranslateModule,
    AsyncPipe,
    JobItemComponent,
  ],
})
export class UpdateDialogComponent {
  selectRunningJobs$ = this.store$.select(selectUpdateJob);
  contentText: { message: string; title: string };

  constructor(private store$: Store<JobsState>) {}

  setMessage(confText: { message: string; title: string }): void {
    this.contentText = confText;
  }
}
