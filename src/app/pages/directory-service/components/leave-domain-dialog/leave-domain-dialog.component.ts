import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/directory-service/active-directory';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './leave-domain-dialog.component.html',
  styleUrls: ['./leave-domain-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveDomainDialogComponent {
  form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private dialogRef: MatDialogRef<LeaveDomainDialogComponent>,
    private dialogService: DialogService,
  ) {}

  onSubmit(): void {
    const params = this.form.value;
    this.loader.open();

    this.ws.job('activedirectory.leave', [params])
      .pipe(untilDestroyed(this))
      .subscribe(
        (job) => {
          if (job.state !== JobState.Success) {
            return;
          }

          this.dialogService.info(
            helptext.ad_leave_domain_dialog.success,
            helptext.ad_leave_domain_dialog.success_msg,
          );

          this.loader.close();
          this.dialogRef.close(true);
        },
        (error) => {
          this.loader.close();
          new EntityUtils().handleWsError(helptext.ad_leave_domain_dialog.error, error, this.dialogService);
        },
      );
  }
}
