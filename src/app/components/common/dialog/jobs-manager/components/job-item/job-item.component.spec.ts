import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { JobItemComponent } from 'app/components/common/dialog/jobs-manager/components/job-item/job-item.component';
import { CoreComponents } from 'app/core/components/core-components.module';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import { mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { DialogService } from 'app/services';
import { ConfirmDialogComponent } from '../../../../../../pages/common/confirm-dialog/confirm-dialog.component';

describe('JobItemComponent', () => {
  let spectator: Spectator<JobItemComponent>;
  let matDialog: MatDialog;

  const createComponent = createComponentFactory({
    component: JobItemComponent,
    imports: [
      EntityModule,
      CoreComponents,
    ],
    providers: [
      DialogService,
      MatDialog,
      FormatDateTimePipe,
      mockWebsocket([]),
    ],
  });

  it('shows running job', () => {
    spectator = createComponent({
      props: {
        job: {
          method: 'cloudsync.sync',
          progress: {
            percent: 99,
            description: 'progress description',
          },
          state: JobState.Running,
          abortable: true,
        } as Job,
      },
    });

    expect(spectator.query('.job-description')).toHaveExactText('cloudsync.sync');
    expect(spectator.query('.job-progress-description')).toHaveExactText('progress description');
    expect(spectator.query('.job-icon-abort')).toBeTruthy();
    expect(spectator.query('.job-icon-failed')).toBeFalsy();
  });

  it('shows failed job', () => {
    spectator = createComponent({
      props: {
        job: {
          method: 'cloudsync.sync',
          progress: {
            percent: 0,
          },
          state: JobState.Failed,
          time_finished: {
            $date: 1632411439082,
          },
          error: 'Broken pipe',
        } as Job,
      },
    });

    expect(spectator.query('.job-description')).toHaveExactText('cloudsync.sync');
    expect(spectator.query('.job-time')).toHaveExactText(' Stopped: 2021-09-23 18:37:19');
    expect(spectator.query('.job-icon-failed')).toBeTruthy();
  });

  describe('entity job modal', () => {
    beforeEach(() => {
      matDialog = spectator.inject(MatDialog);
      jest.spyOn(matDialog, 'open').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('shows entity job modal if user clicks on the job', () => {
      spectator = createComponent({
        props: {
          job: {
            method: 'cloudsync.sync',
            state: JobState.Failed,
            time_finished: {
              $date: 1632411439082,
            },
            error: 'Broken pipe',
          } as Job,
        },
      });
      spectator.click(spectator.query('.job-clickable'));

      expect(matDialog.open).toHaveBeenCalledWith(
        EntityJobComponent,
        {
          data: {
            title: 'cloudsync.sync',
          },
          hasBackdrop: true,
          width: '400px',
        },
      );
    });

    it('shows confirm dialog if user clicks on the abort button', () => {
      spectator = createComponent({
        props: {
          job: {
            method: 'cloudsync.sync',
            progress: {
              percent: 99,
              description: 'Almost finished',
            },
            state: JobState.Running,
            abortable: true,
          } as Job,
        },
      });

      spectator.click(spectator.query('.job-button-abort'));

      expect(matDialog.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        {
          disableClose: true,
        },
      );
    });
  });
});
