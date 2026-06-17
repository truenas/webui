import { DIALOG_DATA } from '@angular/cdk/dialog';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { JobsState } from 'app/modules/jobs/store/job.reducer';
import { selectUpdateJobs } from 'app/modules/jobs/store/job.selectors';

export interface UpdateDialogData {
  message: string;
  title: string;
}

@Component({
  selector: 'ix-update-dialog',
  templateUrl: './update-dialog.component.html',
  styleUrls: ['./update-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    AsyncPipe,
    JobItemComponent,
  ],
})
export class UpdateDialog {
  private store$ = inject<Store<JobsState>>(Store);

  selectRunningJobs$ = this.store$.select(selectUpdateJobs);
  contentText = inject<UpdateDialogData>(DIALOG_DATA);
}
