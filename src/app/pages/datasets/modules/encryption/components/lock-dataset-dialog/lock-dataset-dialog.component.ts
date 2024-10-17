import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-lock-dataset-dialog',
  templateUrl: './lock-dataset-dialog.component.html',
  styleUrls: ['./lock-dataset-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    TranslateModule,
    ReactiveFormsModule,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
  ],
})
export class LockDatasetDialogComponent {
  readonly requiredRoles = [Role.DatasetWrite];

  forceCheckbox = new FormControl(false);

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<LockDatasetDialogComponent>,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public dataset: Dataset,
  ) { }

  onSubmit($event: SubmitEvent): void {
    $event.preventDefault();

    const force = this.forceCheckbox.value;
    this.dialogService.jobDialog(
      this.ws.job('pool.dataset.lock', [this.dataset.id, { force_umount: force }]),
      { title: this.translate.instant(helptextVolumes.lock_dataset_dialog.locking_dataset) },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Dataset locked'));
        this.dialogRef.close(true);
      });
  }
}
