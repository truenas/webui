import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject,
} from '@angular/core';
import {
  MAT_DIALOG_DATA, MatDialogContent, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { JobsState } from 'app/modules/jobs/store/job.reducer';
import { selectUpdateJobs } from 'app/modules/jobs/store/job.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-update-dialog',
  templateUrl: './update-dialog.component.html',
  styleUrls: ['./update-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatDialogTitle,
    TranslateModule,
    AsyncPipe,
    JobItemComponent,
  ],
})
export class UpdateDialog {
  private store$ = inject<Store<JobsState>>(Store);

  selectRunningJobs$ = this.store$.select(selectUpdateJobs);
  contentText = inject<{ message: string; title: string }>(MAT_DIALOG_DATA);
}
