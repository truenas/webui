import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/directory-service/active-directory';
import { LeaveActiveDirectory } from 'app/interfaces/active-directory-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  onSubmit(): void {
    const params = this.form.value;
    this.loader.open();

    this.ws.job('activedirectory.leave', [params as LeaveActiveDirectory])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (job) => {
          if (job.state !== JobState.Success) {
            return;
          }

          this.snackbar.success(
            this.translate.instant(helptext.ad_leave_domain_dialog.success_msg),
          );

          this.loader.close();
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loader.close();
          new EntityUtils().handleWsError(helptext.ad_leave_domain_dialog.error, error, this.dialogService);
        },
      });
  }
}
