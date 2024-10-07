import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cron-delete-dialog',
  templateUrl: './cron-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class CronDeleteDialogComponent {
  readonly requiredRoles = [Role.FullAdmin];

  readonly deleteMessage = T('Are you sure you want to delete cronjob <b>"{name}"</b>?');

  constructor(
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<CronDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cronjob: CronjobRow,
    private errorHandler: ErrorHandlerService,
  ) { }

  onDelete(): void {
    this.ws.call('cronjob.delete', [this.cronjob.id])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Cronjob deleted'));
        this.dialogRef.close(true);
      });
  }
}
