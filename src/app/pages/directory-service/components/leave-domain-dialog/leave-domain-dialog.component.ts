import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextActiveDirectory } from 'app/helptext/directory-service/active-directory';
import { LeaveActiveDirectory } from 'app/interfaces/active-directory-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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

  protected readonly Role = Role;

  constructor(
    private errorHandler: ErrorHandlerService,
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

    this.ws.job('activedirectory.leave', [params as LeaveActiveDirectory])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (job) => {
          if (job.state !== JobState.Success) {
            return;
          }

          this.snackbar.success(
            this.translate.instant(helptextActiveDirectory.ad_leave_domain_dialog.success_msg),
          );

          this.dialogRef.close(true);
        },
        error: (error: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }
}
