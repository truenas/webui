import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextActiveDirectory } from 'app/helptext/directory-service/active-directory';
import { LeaveActiveDirectory } from 'app/interfaces/active-directory-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-leave-domain-dialog',
  templateUrl: './leave-domain-dialog.component.html',
  styleUrls: ['./leave-domain-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    MatDialogClose,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
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
    private api: ApiService,
    private dialogRef: MatDialogRef<LeaveDomainDialogComponent>,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  onSubmit(): void {
    const params = this.form.value;

    this.api.job('activedirectory.leave', [params as LeaveActiveDirectory])
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
